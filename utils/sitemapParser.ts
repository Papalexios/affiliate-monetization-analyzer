// A list of CORS proxies to try in order. This adds redundancy.
const CORS_PROXIES = [
  'https://corsproxy.io/?', // A popular, simple proxy
  'https://api.allorigins.win/raw?url=', // Another reliable proxy
];

/**
 * Fetches the content of a sitemap from a URL using CORS proxies.
 * @param sitemapUrl The URL of the sitemap.
 * @returns A promise that resolves to the XML content as a string.
 */
export const fetchSitemap = async (sitemapUrl: string): Promise<string> => {
    let lastError: Error | null = null;

    for (const proxy of CORS_PROXIES) {
        const proxyUrl = `${proxy}${encodeURIComponent(sitemapUrl)}`;
        try {
            const response = await fetch(proxyUrl);
            if (!response.ok) {
                throw new Error(`Request failed with status: ${response.status}`);
            }
            return await response.text(); // Return the raw text
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown fetch error occurred";
            console.warn(`Sitemap fetch attempt via ${proxy.split('/')[2]} failed: ${errorMessage}`);
            lastError = new Error(errorMessage);
        }
    }

    // If the loop completes without returning, all proxies have failed.
    console.error("All CORS proxies failed for sitemap:", sitemapUrl);
    if (lastError) {
        throw new Error(`Sitemap fetch failed. Last attempt error: ${lastError.message}`);
    }
    
    throw new Error("Sitemap fetch failed. Unable to fetch the sitemap from the provided URL.");
};


/**
 * Parses a sitemap XML string and extracts all URLs.
 * @param xmlContent The sitemap content as a string.
 * @returns An array of URL strings.
 */
export const parseSitemap = (xmlContent: string): string[] => {
    if (!xmlContent || typeof xmlContent !== 'string') {
        throw new Error("Invalid XML content provided. Content must be a non-empty string.");
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "application/xml");
    
    const errorNode = xmlDoc.querySelector("parsererror");
    if (errorNode) {
        console.error("XML parsing error:", errorNode.textContent);
        throw new Error("Failed to parse the sitemap XML. The content may be malformed or not valid XML.");
    }

    if (xmlDoc.querySelector("sitemapindex")) {
        throw new Error("Sitemap index files are not supported. Please provide the XML from a specific sitemap (e.g., page-sitemap.xml).");
    }

    const locs = Array.from(xmlDoc.querySelectorAll("url > loc")).map(loc => loc.textContent?.trim() || '');
    const filteredLocs = locs.filter(loc => loc); // Filter out any empty strings
    
    if (filteredLocs.length === 0) {
        console.warn("Sitemap parsed successfully, but no URLs were found inside <url><loc> tags.");
    }
    
    return filteredLocs;
};
