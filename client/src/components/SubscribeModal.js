import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'flag-icons/css/flag-icons.min.css';
import './Modal.css';
import './SubscribeModal.css';

const SubscribeModal = ({ isOpen, onClose }) => {
  const [methods, setMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Helper function to get ISO country code from phone code
  const getFlagCode = (phoneCode) => {
    const codeMap = {
      '+1': 'us', '+44': 'gb', '+61': 'au', '+49': 'de', '+33': 'fr', '+39': 'it',
      '+34': 'es', '+31': 'nl', '+32': 'be', '+41': 'ch', '+46': 'se', '+47': 'no',
      '+45': 'dk', '+358': 'fi', '+353': 'ie', '+351': 'pt', '+30': 'gr', '+43': 'at',
      '+48': 'pl', '+420': 'cz', '+36': 'hu', '+40': 'ro', '+7': 'ru', '+81': 'jp',
      '+82': 'kr', '+86': 'cn', '+91': 'in', '+55': 'br', '+52': 'mx', '+54': 'ar',
      '+56': 'cl', '+57': 'co', '+51': 'pe', '+27': 'za', '+20': 'eg', '+971': 'ae',
      '+966': 'sa', '+974': 'qa', '+965': 'kw', '+973': 'bh', '+968': 'om', '+961': 'lb',
      '+972': 'il', '+90': 'tr', '+65': 'sg', '+60': 'my', '+66': 'th', '+84': 'vn',
      '+62': 'id', '+63': 'ph', '+64': 'nz', '+880': 'bd', '+92': 'pk', '+94': 'lk',
      '+95': 'mm', '+855': 'kh', '+856': 'la', '+673': 'bn', '+852': 'hk', '+853': 'mo',
      '+886': 'tw', '+998': 'uz', '+380': 'ua', '+375': 'by', '+370': 'lt', '+371': 'lv',
      '+372': 'ee', '+359': 'bg', '+385': 'hr', '+386': 'si', '+421': 'sk', '+389': 'mk',
      '+387': 'ba', '+382': 'me', '+381': 'rs', '+383': 'xk', '+355': 'al', '+234': 'ng',
      '+254': 'ke', '+256': 'ug', '+255': 'tz', '+233': 'gh', '+212': 'ma', '+213': 'dz',
      '+216': 'tn', '+218': 'ly', '+249': 'sd', '+251': 'et', '+260': 'zm', '+263': 'zw',
      '+264': 'na', '+267': 'bw', '+268': 'sz', '+269': 'km', '+250': 'rw', '+257': 'bi',
      '+252': 'so', '+253': 'dj', '+235': 'td', '+236': 'cf', '+237': 'cm', '+238': 'cv',
      '+239': 'st', '+240': 'gq', '+241': 'ga', '+242': 'cg', '+243': 'cd', '+244': 'ao',
      '+245': 'gw', '+248': 'sc', '+258': 'mz', '+261': 'mg', '+265': 'mw', '+266': 'ls',
      '+270': 'mu', '+297': 'aw', '+298': 'fo', '+299': 'gl', '+350': 'gi', '+352': 'lu',
      '+354': 'is', '+356': 'mt', '+357': 'cy', '+376': 'ad', '+377': 'mc', '+378': 'sm',
      '+423': 'li', '+500': 'fk', '+501': 'bz', '+502': 'gt', '+503': 'sv', '+504': 'hn',
      '+505': 'ni', '+506': 'cr', '+507': 'pa', '+509': 'ht', '+590': 'gp', '+591': 'bo',
      '+592': 'gy', '+593': 'ec', '+594': 'gf', '+595': 'py', '+596': 'mq', '+597': 'sr',
      '+598': 'uy', '+599': 'cw', '+670': 'tl', '+673': 'bn', '+674': 'nr', '+675': 'pg',
      '+676': 'to', '+677': 'sb', '+678': 'vu', '+679': 'fj', '+680': 'pw', '+681': 'wf',
      '+682': 'ck', '+683': 'nu', '+684': 'as', '+685': 'ws', '+686': 'ki', '+687': 'nc',
      '+688': 'tv', '+689': 'pf', '+690': 'tk', '+691': 'fm', '+692': 'mh', '+850': 'kp',
      '+960': 'mv', '+962': 'jo', '+963': 'sy', '+964': 'iq', '+967': 'ye', '+970': 'ps',
      '+975': 'bt', '+976': 'mn', '+977': 'np', '+992': 'tj', '+993': 'tm', '+994': 'az',
      '+995': 'ge', '+996': 'kg'
    };
    return codeMap[phoneCode] || 'us';
  };

  // Comprehensive country codes list
  const countryCodes = [
    { code: '+1', country: 'United States/Canada', flagCode: 'us' },
    { code: '+44', country: 'United Kingdom', flagCode: 'gb' },
    { code: '+61', country: 'Australia', flagCode: 'au' },
    { code: '+49', country: 'Germany', flagCode: 'de' },
    { code: '+33', country: 'France', flagCode: 'fr' },
    { code: '+39', country: 'Italy', flagCode: 'it' },
    { code: '+34', country: 'Spain', flagCode: 'es' },
    { code: '+31', country: 'Netherlands', flagCode: 'nl' },
    { code: '+32', country: 'Belgium', flagCode: 'be' },
    { code: '+41', country: 'Switzerland', flagCode: 'ch' },
    { code: '+46', country: 'Sweden', flagCode: 'se' },
    { code: '+47', country: 'Norway', flagCode: 'no' },
    { code: '+45', country: 'Denmark', flagCode: 'dk' },
    { code: '+358', country: 'Finland', flagCode: 'fi' },
    { code: '+353', country: 'Ireland', flagCode: 'ie' },
    { code: '+351', country: 'Portugal', flagCode: 'pt' },
    { code: '+30', country: 'Greece', flagCode: 'gr' },
    { code: '+43', country: 'Austria', flagCode: 'at' },
    { code: '+48', country: 'Poland', flagCode: 'pl' },
    { code: '+420', country: 'Czech Republic', flagCode: 'cz' },
    { code: '+36', country: 'Hungary', flagCode: 'hu' },
    { code: '+40', country: 'Romania', flagCode: 'ro' },
    { code: '+7', country: 'Russia', flagCode: 'ru' },
    { code: '+81', country: 'Japan', flagCode: 'jp' },
    { code: '+82', country: 'South Korea', flagCode: 'kr' },
    { code: '+86', country: 'China', flagCode: 'cn' },
    { code: '+91', country: 'India', flagCode: 'in' },
    { code: '+55', country: 'Brazil', flagCode: 'br' },
    { code: '+52', country: 'Mexico', flagCode: 'mx' },
    { code: '+54', country: 'Argentina', flagCode: 'ar' },
    { code: '+56', country: 'Chile', flagCode: 'cl' },
    { code: '+57', country: 'Colombia', flagCode: 'co' },
    { code: '+51', country: 'Peru', flagCode: 'pe' },
    { code: '+27', country: 'South Africa', flagCode: 'za' },
    { code: '+20', country: 'Egypt', flagCode: 'eg' },
    { code: '+971', country: 'United Arab Emirates', flagCode: 'ae' },
    { code: '+966', country: 'Saudi Arabia', flagCode: 'sa' },
    { code: '+974', country: 'Qatar', flagCode: 'qa' },
    { code: '+965', country: 'Kuwait', flagCode: 'kw' },
    { code: '+973', country: 'Bahrain', flagCode: 'bh' },
    { code: '+968', country: 'Oman', flagCode: 'om' },
    { code: '+961', country: 'Lebanon', flagCode: 'lb' },
    { code: '+972', country: 'Israel', flagCode: 'il' },
    { code: '+90', country: 'Turkey', flagCode: 'tr' },
    { code: '+65', country: 'Singapore', flagCode: 'sg' },
    { code: '+60', country: 'Malaysia', flagCode: 'my' },
    { code: '+66', country: 'Thailand', flagCode: 'th' },
    { code: '+84', country: 'Vietnam', flagCode: 'vn' },
    { code: '+62', country: 'Indonesia', flagCode: 'id' },
    { code: '+63', country: 'Philippines', flagCode: 'ph' },
    { code: '+64', country: 'New Zealand', flagCode: 'nz' },
    { code: '+880', country: 'Bangladesh', flagCode: 'bd' },
    { code: '+92', country: 'Pakistan', flagCode: 'pk' },
    { code: '+94', country: 'Sri Lanka', flagCode: 'lk' },
    { code: '+95', country: 'Myanmar', flagCode: 'mm' },
    { code: '+855', country: 'Cambodia', flagCode: 'kh' },
    { code: '+856', country: 'Laos', flagCode: 'la' },
    { code: '+673', country: 'Brunei', flagCode: 'bn' },
    { code: '+852', country: 'Hong Kong', flagCode: 'hk' },
    { code: '+853', country: 'Macau', flagCode: 'mo' },
    { code: '+886', country: 'Taiwan', flagCode: 'tw' },
    { code: '+998', country: 'Uzbekistan', flagCode: 'uz' },
    { code: '+380', country: 'Ukraine', flagCode: 'ua' },
    { code: '+375', country: 'Belarus', flagCode: 'by' },
    { code: '+370', country: 'Lithuania', flagCode: 'lt' },
    { code: '+371', country: 'Latvia', flagCode: 'lv' },
    { code: '+372', country: 'Estonia', flagCode: 'ee' },
    { code: '+359', country: 'Bulgaria', flagCode: 'bg' },
    { code: '+385', country: 'Croatia', flagCode: 'hr' },
    { code: '+386', country: 'Slovenia', flagCode: 'si' },
    { code: '+421', country: 'Slovakia', flagCode: 'sk' },
    { code: '+389', country: 'North Macedonia', flagCode: 'mk' },
    { code: '+387', country: 'Bosnia and Herzegovina', flagCode: 'ba' },
    { code: '+382', country: 'Montenegro', flagCode: 'me' },
    { code: '+381', country: 'Serbia', flagCode: 'rs' },
    { code: '+355', country: 'Albania', flagCode: 'al' },
    { code: '+234', country: 'Nigeria', flagCode: 'ng' },
    { code: '+254', country: 'Kenya', flagCode: 'ke' },
    { code: '+256', country: 'Uganda', flagCode: 'ug' },
    { code: '+255', country: 'Tanzania', flagCode: 'tz' },
    { code: '+233', country: 'Ghana', flagCode: 'gh' },
    { code: '+212', country: 'Morocco', flagCode: 'ma' },
    { code: '+213', country: 'Algeria', flagCode: 'dz' },
    { code: '+216', country: 'Tunisia', flagCode: 'tn' },
    { code: '+218', country: 'Libya', flagCode: 'ly' },
    { code: '+249', country: 'Sudan', flagCode: 'sd' },
    { code: '+251', country: 'Ethiopia', flagCode: 'et' },
    { code: '+260', country: 'Zambia', flagCode: 'zm' },
    { code: '+263', country: 'Zimbabwe', flagCode: 'zw' },
    { code: '+264', country: 'Namibia', flagCode: 'na' },
    { code: '+267', country: 'Botswana', flagCode: 'bw' },
    { code: '+268', country: 'Eswatini', flagCode: 'sz' },
    { code: '+250', country: 'Rwanda', flagCode: 'rw' },
    { code: '+257', country: 'Burundi', flagCode: 'bi' },
    { code: '+252', country: 'Somalia', flagCode: 'so' },
    { code: '+253', country: 'Djibouti', flagCode: 'dj' },
    { code: '+235', country: 'Chad', flagCode: 'td' },
    { code: '+236', country: 'Central African Republic', flagCode: 'cf' },
    { code: '+237', country: 'Cameroon', flagCode: 'cm' },
    { code: '+238', country: 'Cape Verde', flagCode: 'cv' },
    { code: '+239', country: 'São Tomé and Príncipe', flagCode: 'st' },
    { code: '+240', country: 'Equatorial Guinea', flagCode: 'gq' },
    { code: '+241', country: 'Gabon', flagCode: 'ga' },
    { code: '+242', country: 'Republic of the Congo', flagCode: 'cg' },
    { code: '+243', country: 'DR Congo', flagCode: 'cd' },
    { code: '+244', country: 'Angola', flagCode: 'ao' },
    { code: '+258', country: 'Mozambique', flagCode: 'mz' },
    { code: '+261', country: 'Madagascar', flagCode: 'mg' },
    { code: '+265', country: 'Malawi', flagCode: 'mw' },
    { code: '+266', country: 'Lesotho', flagCode: 'ls' },
    { code: '+270', country: 'Mauritius', flagCode: 'mu' },
    { code: '+248', country: 'Seychelles', flagCode: 'sc' },
    { code: '+297', country: 'Aruba', flagCode: 'aw' },
    { code: '+298', country: 'Faroe Islands', flagCode: 'fo' },
    { code: '+299', country: 'Greenland', flagCode: 'gl' },
    { code: '+350', country: 'Gibraltar', flagCode: 'gi' },
    { code: '+352', country: 'Luxembourg', flagCode: 'lu' },
    { code: '+354', country: 'Iceland', flagCode: 'is' },
    { code: '+356', country: 'Malta', flagCode: 'mt' },
    { code: '+357', country: 'Cyprus', flagCode: 'cy' },
    { code: '+376', country: 'Andorra', flagCode: 'ad' },
    { code: '+377', country: 'Monaco', flagCode: 'mc' },
    { code: '+378', country: 'San Marino', flagCode: 'sm' },
    { code: '+423', country: 'Liechtenstein', flagCode: 'li' },
    { code: '+500', country: 'Falkland Islands', flagCode: 'fk' },
    { code: '+501', country: 'Belize', flagCode: 'bz' },
    { code: '+502', country: 'Guatemala', flagCode: 'gt' },
    { code: '+503', country: 'El Salvador', flagCode: 'sv' },
    { code: '+504', country: 'Honduras', flagCode: 'hn' },
    { code: '+505', country: 'Nicaragua', flagCode: 'ni' },
    { code: '+506', country: 'Costa Rica', flagCode: 'cr' },
    { code: '+507', country: 'Panama', flagCode: 'pa' },
    { code: '+509', country: 'Haiti', flagCode: 'ht' },
    { code: '+590', country: 'Guadeloupe', flagCode: 'gp' },
    { code: '+591', country: 'Bolivia', flagCode: 'bo' },
    { code: '+592', country: 'Guyana', flagCode: 'gy' },
    { code: '+593', country: 'Ecuador', flagCode: 'ec' },
    { code: '+594', country: 'French Guiana', flagCode: 'gf' },
    { code: '+595', country: 'Paraguay', flagCode: 'py' },
    { code: '+596', country: 'Martinique', flagCode: 'mq' },
    { code: '+597', country: 'Suriname', flagCode: 'sr' },
    { code: '+598', country: 'Uruguay', flagCode: 'uy' },
    { code: '+599', country: 'Curaçao', flagCode: 'cw' },
    { code: '+670', country: 'East Timor', flagCode: 'tl' },
    { code: '+674', country: 'Nauru', flagCode: 'nr' },
    { code: '+675', country: 'Papua New Guinea', flagCode: 'pg' },
    { code: '+676', country: 'Tonga', flagCode: 'to' },
    { code: '+677', country: 'Solomon Islands', flagCode: 'sb' },
    { code: '+678', country: 'Vanuatu', flagCode: 'vu' },
    { code: '+679', country: 'Fiji', flagCode: 'fj' },
    { code: '+680', country: 'Palau', flagCode: 'pw' },
    { code: '+681', country: 'Wallis and Futuna', flagCode: 'wf' },
    { code: '+682', country: 'Cook Islands', flagCode: 'ck' },
    { code: '+683', country: 'Niue', flagCode: 'nu' },
    { code: '+684', country: 'American Samoa', flagCode: 'as' },
    { code: '+685', country: 'Samoa', flagCode: 'ws' },
    { code: '+686', country: 'Kiribati', flagCode: 'ki' },
    { code: '+687', country: 'New Caledonia', flagCode: 'nc' },
    { code: '+688', country: 'Tuvalu', flagCode: 'tv' },
    { code: '+689', country: 'French Polynesia', flagCode: 'pf' },
    { code: '+690', country: 'Tokelau', flagCode: 'tk' },
    { code: '+691', country: 'Micronesia', flagCode: 'fm' },
    { code: '+692', country: 'Marshall Islands', flagCode: 'mh' },
    { code: '+850', country: 'North Korea', flagCode: 'kp' },
    { code: '+960', country: 'Maldives', flagCode: 'mv' },
    { code: '+962', country: 'Jordan', flagCode: 'jo' },
    { code: '+963', country: 'Syria', flagCode: 'sy' },
    { code: '+964', country: 'Iraq', flagCode: 'iq' },
    { code: '+967', country: 'Yemen', flagCode: 'ye' },
    { code: '+970', country: 'Palestine', flagCode: 'ps' },
    { code: '+975', country: 'Bhutan', flagCode: 'bt' },
    { code: '+976', country: 'Mongolia', flagCode: 'mn' },
    { code: '+977', country: 'Nepal', flagCode: 'np' },
    { code: '+992', country: 'Tajikistan', flagCode: 'tj' },
    { code: '+993', country: 'Turkmenistan', flagCode: 'tm' },
    { code: '+994', country: 'Azerbaijan', flagCode: 'az' },
    { code: '+995', country: 'Georgia', flagCode: 'ge' },
    { code: '+996', country: 'Kyrgyzstan', flagCode: 'kg' },
  ];

  useEffect(() => {
    if (isOpen) {
      fetchAvailableMethods();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryDropdownOpen && !event.target.closest('.country-code-wrapper')) {
        setCountryDropdownOpen(false);
      }
    };
    
    if (countryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [countryDropdownOpen]);

  const fetchAvailableMethods = async () => {
    try {
      const response = await axios.get('/api/subscriptions/methods');
      if (response.data && response.data.methods) {
        setMethods(response.data.methods);
        // Auto-select first available method
        if (response.data.methods.length > 0) {
          setSelectedMethod(response.data.methods[0].type);
        }
      } else {
        // Fallback to default methods
        setMethods([
          { type: 'email', label: 'Email', available: true, configured: false },
          { type: 'sms', label: 'SMS', available: true, configured: false },
          { type: 'rss', label: 'RSS Feed', available: true, configured: true }
        ]);
        setSelectedMethod('email');
      }
    } catch (err) {
      console.error('Error fetching methods:', err);
      // Show default methods even on error
      setMethods([
        { type: 'email', label: 'Email', available: true, configured: false },
        { type: 'sms', label: 'SMS', available: true, configured: false },
        { type: 'rss', label: 'RSS Feed', available: true, configured: true }
      ]);
      setSelectedMethod('email');
      // Don't show error, just use defaults
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const fullPhone = selectedMethod === 'sms' && phone ? `${countryCode}${phone.replace(/^\+/, '')}` : null;
      
      const response = await axios.post('/api/subscriptions', {
        email: selectedMethod === 'email' ? email : null,
        phone: fullPhone,
        method: selectedMethod
      });

      if (selectedMethod === 'rss') {
        // Open RSS feed
        window.open('/api/rss', '_blank');
        setSuccess('RSS feed opened in new tab');
      } else {
        setSuccess(response.data.message);
      }

      // Reset form after 2 seconds
      setTimeout(() => {
        if (selectedMethod !== 'rss') {
          setEmail('');
          setPhone('');
        }
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCountry = countryCodes.find(c => c.code === countryCode);
  const flagCode = selectedCountry?.flagCode || getFlagCode(countryCode);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay modal" onClick={onClose}>
      <div className="modal-content subscribe-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Subscribe for Updates</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <p className="modal-subtitle">Get notified when services have incidents or status changes</p>

        {methods.length === 0 ? (
          <div className="subscribe-loading">Loading subscription options...</div>
        ) : (
          <form onSubmit={handleSubmit} className="subscribe-form">
            <div className="subscribe-methods">
              {methods.map(method => (
                <label key={method.type} className={`subscribe-method-option ${selectedMethod === method.type ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="method"
                    value={method.type}
                    checked={selectedMethod === method.type}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                  />
                  <div className="method-label">
                    <span className="method-name">{method.label}</span>
                    {method.type === 'rss' && <span className="method-hint">Always available</span>}
                    {method.type === 'email' && (
                      <span className="method-hint">
                        {method.configured ? 'Email notifications' : 'Email notifications (will be enabled when configured)'}
                      </span>
                    )}
                    {method.type === 'sms' && (
                      <span className="method-hint">
                        {method.configured ? 'SMS notifications' : 'SMS notifications (will be enabled when configured)'}
                      </span>
                    )}
                  </div>
                </label>
              ))}
            </div>

            {selectedMethod === 'email' && (
              <div className="subscribe-input-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
            )}

            {selectedMethod === 'sms' && (
              <div className="subscribe-input-group">
                <label htmlFor="phone">Phone Number</label>
                <div className="phone-input-wrapper">
                  <div className="country-code-wrapper">
                    <div 
                      className="country-code-select-custom"
                      onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                    >
                      <span className={`country-flag-display fi fi-${flagCode}`}></span>
                      <span className="country-code-text">{countryCode} {selectedCountry?.country}</span>
                      <span className="country-code-arrow">▼</span>
                    </div>
                    {countryDropdownOpen && (
                      <>
                        <div 
                          className="country-dropdown-overlay"
                          onClick={() => setCountryDropdownOpen(false)}
                        ></div>
                        <div className="country-dropdown">
                          <div className="country-dropdown-search">
                            <input
                              type="text"
                              placeholder="Search country..."
                              className="country-search-input"
                              id="country-search"
                              autoFocus
                            />
                          </div>
                          <div className="country-dropdown-list">
                            {countryCodes.map(country => {
                              const countryFlagCode = country.flagCode || getFlagCode(country.code);
                              return (
                                <div
                                  key={`${country.code}-${country.country}`}
                                  className={`country-dropdown-item ${countryCode === country.code ? 'selected' : ''}`}
                                  onClick={() => {
                                    setCountryCode(country.code);
                                    setCountryDropdownOpen(false);
                                  }}
                                >
                                  <span className={`country-item-flag fi fi-${countryFlagCode}`}></span>
                                  <span className="country-item-code">{country.code}</span>
                                  <span className="country-item-name">{country.country}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="1234567890"
                    required
                    className="phone-input"
                  />
                </div>
                <small className="input-hint">Enter your phone number without the country code</small>
              </div>
            )}

            {selectedMethod === 'rss' && (
              <div className="subscribe-rss-info">
                <p>Click subscribe to open the RSS feed. You can add it to your RSS reader.</p>
                <p className="rss-url">Feed URL: <code>/api/rss</code></p>
              </div>
            )}

            {error && <div className="subscribe-error">{error}</div>}
            {success && <div className="subscribe-success">{success}</div>}

            <div className="subscribe-actions">
              <button type="button" className="subscribe-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="subscribe-submit" disabled={loading}>
                {loading ? 'Subscribing...' : selectedMethod === 'rss' ? 'Open RSS Feed' : 'Subscribe'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SubscribeModal;
