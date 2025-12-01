// Service to fetch real blog posts from online sources

// Fetch posts from Dev.to API (free, no auth required) - FOOD ONLY
async function fetchDevToPosts(tags = ['food', 'cooking', 'recipes', 'nutrition', 'meal-prep'], perPage = 10) {
  try {
    const allPosts = [];
    
    // Fetch from multiple food-related tags
    for (const tag of tags) {
      try {
        const response = await fetch(
          `https://dev.to/api/articles?tag=${tag}&per_page=${perPage}&top=7`
        );
        if (!response.ok) continue;
        
        const posts = await response.json();
        allPosts.push(...posts);
      } catch (err) {
        console.warn(`Failed to fetch Dev.to posts for tag ${tag}:`, err);
      }
    }
    
    // Remove duplicates and filter for food-related content
    const uniquePosts = Array.from(
      new Map(allPosts.map(post => [post.id, post])).values()
    );
    
    // Filter to only food-related posts
    const foodPosts = uniquePosts.filter(post => {
      const title = (post.title || '').toLowerCase();
      const tags = (post.tag_list || []).join(' ').toLowerCase();
      const description = (post.description || post.excerpt || '').toLowerCase();
      const content = `${title} ${tags} ${description}`;
      
      // Food-related keywords
      const foodKeywords = [
        'food', 'cooking', 'recipe', 'meal', 'dish', 'ingredient', 'kitchen',
        'cuisine', 'nutrition', 'diet', 'healthy eating', 'meal prep', 'baking',
        'chef', 'restaurant', 'taste', 'flavor', 'culinary', 'gastronomy'
      ];
      
      // Exclude non-food keywords
      const excludeKeywords = [
        'web development', 'programming', 'javascript', 'python', 'code',
        'software', 'tech startup', 'business', 'marketing', 'design system'
      ];
      
      // Check if it contains food keywords and doesn't contain exclusion keywords
      const hasFoodKeyword = foodKeywords.some(keyword => content.includes(keyword));
      const hasExcludeKeyword = excludeKeywords.some(keyword => content.includes(keyword));
      
      return hasFoodKeyword && !hasExcludeKeyword;
    });
    
    return foodPosts.map(post => ({
      id: `devto-${post.id}`,
      title: post.title,
      category: mapDevToTagToCategory(post.tag_list || []),
      date: post.published_at || post.created_at,
      excerpt: post.description || post.excerpt || '',
      image: post.cover_image || post.social_image || getDefaultImage(post.tag_list || []),
      author: post.user?.name || 'Dev.to Author',
      url: post.url,
      source: 'Dev.to'
    }));
  } catch (error) {
    console.error('Error fetching Dev.to posts:', error);
    return [];
  }
}

// Map Dev.to tags to our categories (food-focused)
function mapDevToTagToCategory(tags) {
  const tagStr = tags.join(' ').toLowerCase();
  
  if (tagStr.includes('cooking') || tagStr.includes('recipe') || tagStr.includes('baking') || tagStr.includes('meal prep')) {
    return 'Cooking Tips';
  }
  if (tagStr.includes('nutrition') || tagStr.includes('health') || tagStr.includes('diet') || tagStr.includes('allergen')) {
    return 'Nutrition & Allergens';
  }
  if (tagStr.includes('sustainability') || tagStr.includes('waste') || tagStr.includes('environment') || tagStr.includes('eco')) {
    return 'Sustainability';
  }
  if (tagStr.includes('food') || tagStr.includes('cuisine') || tagStr.includes('culinary')) {
    return 'Cooking Tips'; // default for food content
  }
  
  return 'Cooking Tips'; // default for food articles
}

// Get default image based on category
function getDefaultImage(tags) {
  const tagStr = tags.join(' ').toLowerCase();
  
  if (tagStr.includes('food') || tagStr.includes('cooking')) {
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop';
  }
  if (tagStr.includes('ai') || tagStr.includes('tech')) {
    return 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=600&fit=crop';
  }
  if (tagStr.includes('nutrition') || tagStr.includes('health')) {
    return 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=600&fit=crop';
  }
  if (tagStr.includes('sustainability')) {
    return 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=600&fit=crop';
  }
  
  return 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&h=600&fit=crop';
}

// Fetch posts from RSS feeds (using a CORS proxy) - Multiple food blog sources
async function fetchRSSPosts() {
  // Multiple food blog RSS feeds
  const feeds = [
    { url: 'https://www.foodnetwork.com/feeds/rss', name: 'Food Network', limit: 8 },
    { url: 'https://www.allrecipes.com/feeds/rss', name: 'AllRecipes', limit: 8 },
    { url: 'https://www.bonappetit.com/feed/rss', name: 'Bon Appétit', limit: 8 },
    { url: 'https://www.seriouseats.com/feeds/index.rss', name: 'Serious Eats', limit: 8 },
    { url: 'https://www.food52.com/blog.rss', name: 'Food52', limit: 8 },
    { url: 'https://www.tasteofhome.com/feed/', name: 'Taste of Home', limit: 8 },
    { url: 'https://www.delish.com/feeds/rss', name: 'Delish', limit: 8 },
    { url: 'https://www.eatingwell.com/feeds/rss', name: 'Eating Well', limit: 8 },
    { url: 'https://www.cookinglight.com/feeds/rss', name: 'Cooking Light', limit: 8 },
    { url: 'https://www.simplyrecipes.com/feed', name: 'Simply Recipes', limit: 8 },
  ];
  
  const posts = [];
  
  // Fetch from all feeds in parallel
  const feedPromises = feeds.map(async ({ url, name, limit }) => {
    try {
      // Try multiple RSS proxy services for better reliability
      const proxies = [
        `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`,
        `https://rss-to-json-serverless-api.vercel.app/api?feedURL=${encodeURIComponent(url)}`,
      ];
      
      let data = null;
      let lastError = null;
      
      // Try each proxy until one works
      for (const proxyUrl of proxies) {
        try {
          const response = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          });
          
          if (response.ok) {
            data = await response.json();
            break; // Success, exit loop
          }
        } catch (err) {
          lastError = err;
          continue; // Try next proxy
        }
      }
      
      if (!data || !data.items) {
        throw lastError || new Error('No data from proxies');
      }
      
      // Transform RSS items to our format
      const transformed = data.items.slice(0, limit).map((item, index) => {
        // Clean HTML from description
        const cleanDescription = item.description
          ? item.description.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim()
          : '';
        
        // Extract image from content or use thumbnail
        let imageUrl = item.thumbnail || item.enclosure?.link;
        if (!imageUrl && item.content) {
          const imgMatch = item.content.match(/<img[^>]+src="([^"]+)"/i);
          if (imgMatch) imageUrl = imgMatch[1];
        }
        
        return {
          id: `rss-${name}-${Date.now()}-${index}`,
          title: item.title || 'Untitled',
          category: categorizePost(item.title + ' ' + cleanDescription),
          date: item.pubDate || item.published || new Date().toISOString(),
          excerpt: cleanDescription.substring(0, 200) || 'No description available.',
          image: imageUrl || getDefaultImage(['food']),
          author: name,
          url: item.link || item.guid,
          source: name
        };
      });
      
      return transformed;
    } catch (error) {
      console.warn(`Failed to fetch RSS feed ${name} (${url}):`, error.message);
      return [];
    }
  });
  
  // Wait for all feeds and combine results
  const results = await Promise.allSettled(feedPromises);
  results.forEach((result) => {
    if (result.status === 'fulfilled' && Array.isArray(result.value)) {
      posts.push(...result.value);
    }
  });
  
  return posts;
}

// Categorize post based on content
function categorizePost(content) {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('nutrition') || lowerContent.includes('health') || 
      lowerContent.includes('diet') || lowerContent.includes('allergen')) {
    return 'Nutrition & Allergens';
  }
  if (lowerContent.includes('sustainability') || lowerContent.includes('waste') || 
      lowerContent.includes('environment') || lowerContent.includes('eco')) {
    return 'Sustainability';
  }
  if (lowerContent.includes('recipe') || lowerContent.includes('cooking') || 
      lowerContent.includes('baking') || lowerContent.includes('meal prep')) {
    return 'Cooking Tips';
  }
  
  return 'Cooking Tips'; // default
}

// Remove duplicate posts based on title similarity
function removeDuplicates(posts) {
  const seen = new Set();
  const unique = [];
  
  for (const post of posts) {
    // Normalize title for comparison
    const normalizedTitle = post.title.toLowerCase().trim();
    
    // Check if we've seen a similar title (fuzzy matching)
    let isDuplicate = false;
    for (const seenTitle of seen) {
      // Simple similarity check - if titles are very similar, consider it a duplicate
      const similarity = calculateSimilarity(normalizedTitle, seenTitle);
      if (similarity > 0.85) { // 85% similarity threshold
        isDuplicate = true;
        break;
      }
    }
    
    if (!isDuplicate) {
      seen.add(normalizedTitle);
      unique.push(post);
    }
  }
  
  return unique;
}

// Simple string similarity calculation (Jaccard similarity)
function calculateSimilarity(str1, str2) {
  const words1 = new Set(str1.split(/\s+/));
  const words2 = new Set(str2.split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

// Fallback to mock data if API calls fail
async function getFallbackPosts() {
  const { blogPosts } = await import('../data/blogPosts');
  return blogPosts;
}

// Main function to fetch all blog posts (FOOD ONLY)
export async function fetchBlogPosts() {
  try {
    // Fetch from multiple sources in parallel with timeout
    const fetchWithTimeout = (promise, timeout = 8000) => {
      return Promise.race([
        promise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), timeout)
        )
      ]);
    };

    const [devToPosts, rssPosts] = await Promise.allSettled([
      fetchWithTimeout(fetchDevToPosts(['food', 'cooking', 'recipes', 'nutrition', 'meal-prep', 'baking'], 15)),
      fetchWithTimeout(fetchRSSPosts(), 15000) // Longer timeout for RSS (more feeds)
    ]);
    
    // Extract successful results
    const posts = [];
    if (devToPosts.status === 'fulfilled') {
      posts.push(...devToPosts.value);
    }
    if (rssPosts.status === 'fulfilled') {
      posts.push(...rssPosts.value);
    }
    
    // Remove duplicates based on title similarity
    const uniquePosts = removeDuplicates(posts);
    
    // If we got some posts, use them; otherwise fall back to mock data
    if (uniquePosts.length > 0) {
      // Sort by date (newest first)
      uniquePosts.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
      });
      
      // Return all unique posts (no limit - let pagination handle it)
      return uniquePosts;
    } else {
      // Fallback to mock data if no real posts were fetched
      console.warn('No real blog posts fetched, using fallback data');
      return await getFallbackPosts();
    }
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    // Return fallback data on error
    return await getFallbackPosts();
  }
}

