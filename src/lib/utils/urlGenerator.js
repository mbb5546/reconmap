/**
 * Determines if a port is running an HTTP/HTTPS service
 * @param {Object} port - Port object from scan data
 * @returns {{ isHttp: boolean, isHttps: boolean }}
 */
export function detectHttpService(port) {
  const httpIndicators = ['http', 'www', 'web', 'apache', 'nginx', 'iis', 'lighttpd', 'tomcat'];
  const httpsIndicators = ['https', 'ssl', 'tls'];
  const commonHttpPorts = [80, 8080, 8000, 8008, 3000, 5000, 8888, 9000, 9080];
  const commonHttpsPorts = [443, 8443, 4443, 9443];

  const serviceName = port.service?.name?.toLowerCase() || '';
  const product = port.service?.product?.toLowerCase() || '';
  const tunnel = port.service?.tunnel?.toLowerCase() || '';
  const extraInfo = port.service?.extrainfo?.toLowerCase() || '';

  // Check all text fields for indicators
  const allText = `${serviceName} ${product} ${extraInfo}`;

  // Determine if HTTPS
  const isHttps =
    httpsIndicators.some(ind => allText.includes(ind)) ||
    tunnel === 'ssl' ||
    commonHttpsPorts.includes(port.number);

  // Determine if HTTP (including HTTPS services)
  const isHttp =
    isHttps ||
    httpIndicators.some(ind => allText.includes(ind)) ||
    commonHttpPorts.includes(port.number);

  return { isHttp, isHttps };
}

/**
 * Generates a URL for a given host and port
 * @param {Object} host - Host object
 * @param {Object} port - Port object
 * @returns {string|null} - URL or null if not HTTP
 */
export function generateUrl(host, port) {
  const { isHttp, isHttps } = detectHttpService(port);

  if (!isHttp) return null;

  const protocol = isHttps ? 'https' : 'http';
  const address = host.hostname || host.ip;

  // Don't include standard ports in URL
  const needsPort = !(
    (protocol === 'http' && port.number === 80) ||
    (protocol === 'https' && port.number === 443)
  );

  return needsPort
    ? `${protocol}://${address}:${port.number}`
    : `${protocol}://${address}`;
}

/**
 * Copies text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Success status
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}
