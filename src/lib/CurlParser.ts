// Parse raw CURL to method, url, headers, and payload
export function parseCurl(curl: string) {
    let method = 'GET', url = '', headers: Record<string, string> = {}, payload = '';
    const methodMatch = curl.match(/--request\\s+(\\w+)/i);
    if (methodMatch) method = methodMatch[1];
    const urlMatch = curl.match(/--url\\s+'(.*?)'/);
    if (urlMatch) url = urlMatch[1];

    const headerRegex = /--header\\s+'([^:]+):\\s*(.+?)'/g;
    let match;
    while ((match = headerRegex.exec(curl))) {
        headers[match[1].trim()] = match[2].trim();
    }

    const payloadMatch = curl.match(/--data(?:-raw)?\\s+'([\\s\\S]+?)'/);
    if (payloadMatch) payload = payloadMatch[1];

    return { method, url, headers, payload };
}
