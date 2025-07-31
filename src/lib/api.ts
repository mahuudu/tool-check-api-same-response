
export interface Test {
    id: string;
    group: string;
    key: string;
    curlRaw: string;
    method: string;
    url: string;
    headers: Record<string, string>;
    payload: string;
    response: { status: number; statusText: string; headers: Record<string, string>; body: string; ok: boolean; error?: string } | null;
    status: 'pending' | 'processing' | 'success' | 'error';
    diff: string | null;
    timestamp: string;
    selected: boolean;
}

export interface CurlData {
    method: string;
    url: string;
    headers: Record<string, string>;
    payload: string;
}

export function safeJsonParse(str: string): any {
    try {
        return JSON.parse(str);
    } catch (e) {
        return null;
    }
}

export function deepDiff(obj1: any, obj2: any): any {
    if (typeof obj1 !== typeof obj2) return { from: obj1, to: obj2 };
    if (typeof obj1 !== 'object' || obj1 === null || obj2 === null) {
        return obj1 === obj2 ? null : { from: obj1, to: obj2 };
    }
    const diff: Record<string, any> = {};
    const keys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);
    for (const key of keys) {
        const d = deepDiff(obj1[key], obj2[key]);
        if (d) diff[key] = d;
    }
    return Object.keys(diff).length > 0 ? diff : null;
}

export function diffText(a: unknown, b: unknown): string {
    const aStr = typeof a === 'string' ? a : JSON.stringify(a ?? '');
    const bStr = typeof b === 'string' ? b : JSON.stringify(b ?? '');

    if (!aStr || !bStr) return 'N/A';

    const aLines = aStr.split('\n');
    const bLines = bStr.split('\n');

    for (let i = 0; i < Math.min(aLines.length, bLines.length); i++) {
        if (aLines[i] !== bLines[i]) {
            return `Line ${i + 1}: \n - ${aLines[i]} \n + ${bLines[i]}`;
        }
    }

    if (aLines.length !== bLines.length) {
        return `Different number of lines (${aLines.length} vs ${bLines.length})`;
    }

    return '✅ No difference';
}

export function diffTextDeep(a: string, b: string): string {
    try {
        const objA = safeJsonParse(a);
        const objB = safeJsonParse(b);
        if (!objA || !objB) throw new Error('Invalid JSON');
        const diff = deepDiff(objA, objB);
        return diff ? JSON.stringify(diff, null, 2) : '✅ No difference';
    } catch (_) {
        return diffText(a, b);
    }
}

export function parseCurl(curlCommand: string): CurlData {
    let method = 'GET';
    let url = '';
    let headers: Record<string, string> = {};
    let payload = '';

    try {
        const methodMatch = curlCommand.match(/--request\s+(\w+)/i);
        if (methodMatch) method = methodMatch[1].toUpperCase();

        const urlMatch = curlCommand.match(/(?:--url|--location(?:\s+--request\s+\w+)?)\s*['"]?(https?:\/\/[^\s'"]+)['"]?/i);
        if (urlMatch) url = urlMatch[1];

        const headerRegex = /--header\s+'([^:]+):\s*(.+?)'/g;
        let headerMatch;
        while ((headerMatch = headerRegex.exec(curlCommand)) !== null) {
            headers[headerMatch[1].trim()] = headerMatch[2].trim();
        }

        const payloadMatch = curlCommand.match(/--data(?:-raw)?\s+'([\s\S]+?)'/);
        if (payloadMatch) payload = payloadMatch[1];

        return { method, url, headers, payload };
    } catch (e) {
        throw new Error('Không thể parse CURL command: ' + (e as Error).message);
    }
}

export async function makeApiCall(
    method: string,
    url: string,
    headers: Record<string, string>,
    payload: string,
    overrideToken?: string
): Promise<Test['response']> {
    const finalHeaders = {
        'Content-Type': 'application/json',
        ...headers,
    };

    if (overrideToken) {
        finalHeaders['Authorization'] = `Bearer ${overrideToken}`;
    }

    const options: RequestInit = {
        method,
        headers: finalHeaders,
    };

    if (['POST', 'PUT', 'PATCH'].includes(method) && payload) {
        options.body = payload;
    }

    try {
        const response = await fetch(url, options);

        const raw = await response.text();

        let parsed: any = raw;
        try {
            parsed = JSON.parse(raw);
        } catch {
            parsed = raw; // fallback to raw string if not valid JSON
        }

        return {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body: parsed,
            ok: response.ok,
        };
    } catch (e) {
        return {
            status: 0,
            statusText: 'Error',
            headers: {},
            body: '',
            ok: false,
            error: (e as Error).message,
        };
    }
}



export function deepCompare(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;
    if (obj1 == null || obj2 == null) return obj1 === obj2;
    if (typeof obj1 !== typeof obj2) return false;
    if (typeof obj1 !== 'object') return obj1 === obj2;
    if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) return false;
    for (const key of keys1) {
        if (!keys2.includes(key)) return false;
        if (!deepCompare(obj1[key], obj2[key])) return false;
    }
    return true;
}

export interface Difference {
    path: string;
    type: 'added' | 'removed' | 'value_change' | 'type_change';
    old?: any;
    new?: any;
    oldValue?: any;
    newValue?: any;
}

export function findDifferences(obj1: any, obj2: any, path: string = ''): Difference[] {
    const differences: Difference[] = [];
    if (obj1 === obj2) return differences;
    if (typeof obj1 !== typeof obj2) {
        differences.push({
            path: path || 'root',
            type: 'type_change',
            old: typeof obj1,
            new: typeof obj2,
            oldValue: obj1,
            newValue: obj2,
        });
        return differences;
    }
    if (typeof obj1 !== 'object' || obj1 == null || obj2 == null) {
        if (obj1 !== obj2) {
            differences.push({
                path: path || 'root',
                type: 'value_change',
                old: obj1,
                new: obj2,
            });
        }
        return differences;
    }
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
    for (const key of allKeys) {
        const newPath = path ? `${path}.${key} ` : key;
        if (!(key in obj1)) {
            differences.push({
                path: newPath,
                type: 'added',
                new: obj2[key],
            });
        } else if (!(key in obj2)) {
            differences.push({
                path: newPath,
                type: 'removed',
                old: obj1[key],
            });
        } else {
            differences.push(...findDifferences(obj1[key], obj2[key], newPath));
        }
    }
    return differences;
}

export function parseResponseBody(body: string): any {
    if (!body) return body;
    try {
        return JSON.parse(body);
    } catch (e) {
        return body;
    }
}


let counter = 0;
let lastTimestamp = 0;

export const generateUniqueKey = (): string => {
    const timestamp = Date.now();
    if (timestamp !== lastTimestamp) {
        counter = 0;
        lastTimestamp = timestamp;
    }
    const ts = timestamp.toString(36);
    const currentCounter = counter++;
    const uniqueCounter = currentCounter.toString(36).padStart(4, '0');
    const randoms = Array.from({ length: 16 }, () => (Math.random() * 16) | 0);


    const uuid = Array.from({ length: 16 }, (_, i) => {
        if (i === 8) return '4';
        if (i === 10) return ((randoms[i] & 0x3) | 0x8).toString(16);
        return randoms[i].toString(16);
    }).join('');

    return `${ts}-${uniqueCounter}-${uuid}`;
};