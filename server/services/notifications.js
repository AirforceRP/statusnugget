const axios = require('axios');
const db = require('../database');

// Optional Twilio - only require if credentials are provided
let twilio = null;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilio = require('twilio');
  }
} catch (err) {
  console.warn('Twilio module not available. SMS notifications will be disabled.');
}

// Store last known status to detect changes
const lastStatus = {};

// Twilio client (optional)
let twilioClient = null;
if (twilio && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

// ClickSend API configuration
const CLICKSEND_API_URL = 'https://rest.clicksend.com/v3/sms/send';
const CLICKSEND_USERNAME = process.env.CLICKSEND_USERNAME;
const CLICKSEND_API_KEY = process.env.CLICKSEND_API_KEY;

const sendTwilioSMS = async (to, message) => {
  if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
    console.log('Twilio not configured');
    return false;
  }

  try {
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });
    return true;
  } catch (error) {
    console.error('Twilio SMS error:', error);
    return false;
  }
};

const sendClickSendSMS = async (to, message) => {
  if (!CLICKSEND_USERNAME || !CLICKSEND_API_KEY) {
    console.log('ClickSend not configured');
    return false;
  }

  try {
    const auth = Buffer.from(`${CLICKSEND_USERNAME}:${CLICKSEND_API_KEY}`).toString('base64');
    const response = await axios.post(
      CLICKSEND_API_URL,
      {
        messages: [
          {
            source: 'sdk',
            body: message,
            to: to
          }
        ]
      },
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.status === 200;
  } catch (error) {
    console.error('ClickSend SMS error:', error);
    return false;
  }
};

const getNotificationRecipients = (serviceId) => {
  // Get notification settings from database
  // For now, return from environment or default
  const recipients = [];
  
  if (process.env.NOTIFICATION_PHONE_TWILIO) {
    recipients.push({ provider: 'twilio', phone: process.env.NOTIFICATION_PHONE_TWILIO });
  }
  
  if (process.env.NOTIFICATION_PHONE_CLICKSEND) {
    recipients.push({ provider: 'clicksend', phone: process.env.NOTIFICATION_PHONE_CLICKSEND });
  }
  
  return recipients;
};

const checkAndNotify = async (service) => {
  const serviceId = service.id;
  const currentStatus = service.status;
  const previousStatus = lastStatus[serviceId];
  
  // Update last known status
  lastStatus[serviceId] = currentStatus;
  
  // Only notify on status changes
  if (previousStatus && previousStatus !== currentStatus) {
    const recipients = getNotificationRecipients(serviceId);
    const message = currentStatus === 'down' 
      ? `🚨 ALERT: ${service.name} is DOWN! URL: ${service.url}`
      : `✅ RECOVERED: ${service.name} is back UP! URL: ${service.url}`;
    
    for (const recipient of recipients) {
      if (recipient.provider === 'twilio') {
        await sendTwilioSMS(recipient.phone, message);
      } else if (recipient.provider === 'clicksend') {
        await sendClickSendSMS(recipient.phone, message);
      }
    }
    
    console.log(`Notification sent for ${service.name}: ${previousStatus} -> ${currentStatus}`);
  }
};

// Initialize last status for all services
const initializeLastStatus = () => {
  const dbInstance = db.getDb();
  dbInstance.all('SELECT id, status FROM services', [], (err, services) => {
    if (err) {
      console.error('Error initializing last status:', err);
      return;
    }
    
    services.forEach(service => {
      lastStatus[service.id] = service.status;
    });
  });
};

module.exports = {
  checkAndNotify,
  initializeLastStatus,
  sendTwilioSMS,
  sendClickSendSMS
};

