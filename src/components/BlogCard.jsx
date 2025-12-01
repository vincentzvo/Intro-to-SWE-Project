export default function BlogCard({ post }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      "Cooking Tips": "bg-orange-100 text-orange-700",
      "AI & Technology": "bg-blue-100 text-blue-700",
      "Nutrition & Allergens": "bg-green-100 text-green-700",
      "Sustainability": "bg-emerald-100 text-emerald-700"
    };
    return colors[category] || "bg-gray-100 text-gray-700";
  };

  const handleClick = () => {
    if (post.url) {
      window.open(post.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <article 
      onClick={handleClick}
      className={`group bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 flex flex-col ${
        post.url ? 'cursor-pointer' : ''
      }`}
    >
      {/* Image */}
      <div className="relative w-full h-48 overflow-hidden bg-gray-100">
        <img
          src={post.image}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            // Fallback to default image if image fails to load
            e.target.src = 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&h=600&fit=crop';
          }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 p-5 flex flex-col">
        {/* Category Badge */}
        <div className="mb-3">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(post.category)}`}>
            {post.category}
          </span>
        </div>

        {/* Title */}
        <h3 
          className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden"
          }}
          title={post.title}
        >
          {post.title}
        </h3>

        {/* Date */}
        <p className="text-sm text-gray-500 mb-3">
          {formatDate(post.date)}
        </p>

        {/* Excerpt */}
        <p 
          className="text-gray-600 text-sm leading-relaxed flex-1"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden"
          }}
        >
          {post.excerpt}
        </p>

        {/* Source badge */}
        {post.source && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">Source: {post.source}</span>
          </div>
        )}
      </div>
    </article>
  );
}

