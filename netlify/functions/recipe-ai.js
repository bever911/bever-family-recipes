// Netlify serverless function to securely call Claude API
// The API key is stored as an environment variable, not in code

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { type, content, imageData, imageType, url } = JSON.parse(event.body);
    
    // Get API key from environment variable
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'API key not configured' })
      };
    }

    let messages;
    let recipeContent = content;

    // If URL provided, fetch the page content first
    if (type === 'fetch-url' && url) {
      try {
        const pageResponse = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; RecipeBot/1.0)'
          }
        });
        
        if (!pageResponse.ok) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Could not fetch that URL. Try pasting the recipe content instead.' })
          };
        }
        
        recipeContent = await pageResponse.text();
        
        // Strip HTML tags and get text content (basic extraction)
        recipeContent = recipeContent
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 20000); // Limit content size
          
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Could not fetch that URL. The site may be blocking requests. Try pasting the recipe content instead.' })
        };
      }
    }

    if (type === 'scan-image') {
      // Handle image scanning
      messages = [{
        role: 'user',
        content: [
          { 
            type: 'image', 
            source: { 
              type: 'base64', 
              media_type: imageType, 
              data: imageData 
            } 
          },
          { 
            type: 'text', 
            text: `Extract the recipe from this image. Return JSON only:
{
  "title": "Recipe name",
  "category": "one of: breakfast, main-course, side-dish, dessert, pasta, soup, salad, appetizer, bread, beverage, other",
  "author": "who contributed it if shown",
  "servings": "yield",
  "prepTime": "prep time",
  "cookTime": "cook time", 
  "ingredients": [{"amount": "1 cup", "ingredient": "flour"}, ...],
  "instructions": ["Step 1 text", "Step 2 text", ...],
  "notes": "any notes or tips"
}
Return ONLY valid JSON.` 
          }
        ]
      }];
    } else if (type === 'extract-website' || type === 'fetch-url') {
      // Handle website content extraction
      messages = [{
        role: 'user',
        content: `Extract the recipe from this website content. Ignore any ads, navigation, comments, or other non-recipe content. Return JSON only:
{
  "title": "Recipe name",
  "category": "one of: breakfast, main-course, side-dish, dessert, pasta, soup, salad, appetizer, bread, beverage, other",
  "author": "recipe author or website name if shown",
  "servings": "yield/servings",
  "prepTime": "prep time",
  "cookTime": "cook time", 
  "ingredients": [{"amount": "1 cup", "ingredient": "flour"}, ...],
  "instructions": ["Step 1 text", "Step 2 text", ...],
  "notes": "any tips or notes from the recipe"
}
Return ONLY valid JSON.

Website content:
${recipeContent.substring(0, 15000)}`
      }];
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid request type' })
      };
    }

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Claude API error:', data);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: data.error?.message || 'API request failed' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
