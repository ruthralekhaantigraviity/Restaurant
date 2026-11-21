import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Store, Search, MapPin, Star, Clock, Truck, 
  Sparkles, UtensilsCrossed, ArrowLeft 
} from 'lucide-react';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { getApiUrl } from '../../utils/axiosInstance';
import axios from 'axios';

export default function Restaurants() {
  const navigate = useNavigate();
  const { api } = useCustomerAuth();

  const [restaurants, setRestaurants] = useState(() => {
    try {
      const cached = localStorage.getItem('foodnest_explore_restaurants_cache');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [loading, setLoading] = useState(restaurants.length === 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');

  useEffect(() => {
    let isMounted = true;
    const fetchRestaurants = async () => {
      try {
        const client = api || axios;
        const apiUrl = getApiUrl ? getApiUrl() : '/api';
        const res = await client.get(`${apiUrl}/restaurants`, { timeout: 8000 });
        if (isMounted && Array.isArray(res.data)) {
          const approved = res.data.filter(
            (r) => r.isDeleted !== true && r.status !== 'Inactive' && (r.approvalStatus === 'Approved' || r.approvalStatus === 'Pending' || !r.approvalStatus)
          );
          const mapped = approved.map((r) => {
            const showcaseImg = (Array.isArray(r.showcaseImages) && r.showcaseImages.length > 0 ? r.showcaseImages[0] : null)
              || (typeof r.showcaseImages === 'string' && r.showcaseImages ? r.showcaseImages : null)
              || r.bannerImage
              || r.image
              || (r.logo && !r.logo.includes('.pdf') ? r.logo : null);

            let rawImg = showcaseImg || null;
            if (rawImg && typeof rawImg === 'string') {
              const apiBase = getApiUrl();
              const origin = apiBase.startsWith('http') ? new URL(apiBase).origin : (typeof window !== 'undefined' ? window.location.origin : '');
              if (!rawImg.startsWith('http') && !rawImg.startsWith('data:')) {
                rawImg = origin + (rawImg.startsWith('/') ? '' : '/') + rawImg;
              }
            }

            return {
              _id: r._id,
              name: r.name,
              rating: r.rating ? String(r.rating) : '4.5',
              deliveryTime: r.deliveryTime || '25-35 min',
              cuisines: r.cuisineType || r.cuisine || 'Multi-Cuisine • Pure Veg & Non-Veg',
              image: rawImg,
              city: r.city || '',
              address: r.address || 'Verified Outlet',
              branches: r.branches || [],
              deliverySettings: r.deliverySettings || { radius: 5 }
            };
          });
          setRestaurants(mapped);
          try {
            localStorage.setItem('foodnest_explore_restaurants_cache', JSON.stringify(mapped));
          } catch {}
        }
      } catch (err) {
        console.warn('Failed to load registered restaurants:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRestaurants();
    return () => { isMounted = false; };
  }, [api]);

  // Dynamic Cities
  const cities = useMemo(() => {
    const set = new Set();
    restaurants.forEach((r) => {
      if (r.city && r.city.trim()) set.add(r.city.trim());
    });
    return ['All', ...Array.from(set)];
  }, [restaurants]);

  // Filtered Restaurants
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        (r.name || '').toLowerCase().includes(q) ||
        (r.cuisines || '').toLowerCase().includes(q) ||
        (r.city || '').toLowerCase().includes(q) ||
        (r.address || '').toLowerCase().includes(q);

      const matchesCity = selectedCity === 'All' || (r.city || '').toLowerCase() === selectedCity.toLowerCase();

      return matchesSearch && matchesCity;
    });
  }, [restaurants, searchQuery, selectedCity]);

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-left">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                title="Go Back"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Store className="text-[#FF5A1F]" size={22} />
                  <span>All Registered Restaurants</span>
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Showing {filteredRestaurants.length} of {restaurants.length} verified partner restaurants nationwide
                </p>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search restaurants, cuisines, cities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#FF5A1F] transition-all"
              />
            </div>
          </div>

          {/* City Filter Chips */}
          {cities.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pt-3.5 pb-0.5 no-scrollbar">
              {cities.map((city) => {
                const isActive = selectedCity === city;
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setSelectedCity(city)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-[#FF5A1F] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {city}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
                <div className="aspect-[16/9] w-full bg-slate-200" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center max-w-md mx-auto space-y-3 mt-8">
            <div className="w-12 h-12 rounded-full bg-orange-100 text-[#FF5A1F] flex items-center justify-center mx-auto">
              <UtensilsCrossed size={22} />
            </div>
            <h3 className="text-base font-bold text-slate-900">No restaurants found</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No registered restaurants matched your search filter. Clear your search or choose another city.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCity('All');
              }}
              className="px-4 py-2 bg-[#FF5A1F] hover:bg-[#e04f1a] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {filteredRestaurants.map((rest) => {
              const deliveryRadius = rest.deliverySettings?.radius || 5;
              const primaryBranch = rest.branches?.[0];
              const outletAddress = primaryBranch?.location?.address || rest.address || (rest.city ? `${rest.city}, India` : 'Registered Address');

              return (
                <div
                  key={rest._id}
                  onClick={() => navigate(`/restaurant/${rest._id}`)}
                  className="group bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer text-left flex flex-col justify-between"
                >
                  <div>
                    {/* 16:9 Cover Image */}
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 flex items-center justify-center">
                      {rest.image ? (
                        <img
                          src={rest.image}
                          alt={rest.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextElementSibling) {
                              e.currentTarget.nextElementSibling.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-orange-50/40 text-slate-400 group-hover:text-[#FF5A1F] transition-colors ${
                          rest.image ? 'hidden' : 'flex'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-200/60 flex items-center justify-center text-[#FF5A1F]">
                          <UtensilsCrossed size={18} />
                        </div>
                        <span className="text-[11px] font-bold text-slate-600 mt-1.5">{rest.name}</span>
                      </div>

                      {/* Delivery Radius Badge */}
                      <div className="absolute top-2.5 right-2.5 bg-black/65 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs border border-white/20">
                        <Truck size={10} className="text-[#FF5A1F]" />
                        <span>Delivery within {deliveryRadius} km</span>
                      </div>

                      {rest.image && (
                        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                          <Sparkles size={10} className="text-amber-300" />
                          <span>Showcase</span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="p-3 space-y-1.5">
                      <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold">
                        <div className="flex items-center gap-1 text-slate-800 font-bold">
                          <Star size={12} className="fill-amber-400 text-amber-400" />
                          <span>{rest.rating || '4.5'}</span>
                        </div>
                        <span className="text-slate-300 mx-1">•</span>
                        <div className="flex items-center gap-1 text-slate-500">
                          <Clock size={11} className="text-slate-400" />
                          <span className="text-[11px] font-medium">{rest.deliveryTime}</span>
                        </div>
                      </div>

                      <h3 className="text-sm sm:text-[15px] font-bold text-slate-900 group-hover:text-[#FF5A1F] transition-colors line-clamp-1">
                        {rest.name}
                      </h3>

                      <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                        <p className="line-clamp-1 text-[12px]">{rest.cuisines}</p>
                        {rest.city && (
                          <span className="text-[10px] text-slate-600 bg-slate-100 font-semibold px-1.5 py-0.5 rounded shrink-0 ml-1">
                            {rest.city}
                          </span>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <div className="flex items-center gap-1 min-w-0 pr-1 text-slate-600 font-medium truncate">
                          <MapPin size={12} className="text-[#FF5A1F] shrink-0" />
                          <span className="truncate">{outletAddress}</span>
                        </div>
                        <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-50 text-[#FF5A1F] border border-orange-200/60">
                          Main Outlet
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="px-3 pb-3 pt-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 pt-1.5 border-t border-slate-50">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Truck size={10} className="text-[#FF5A1F]" /> Home Delivery: <strong className="text-slate-700">Available</strong>
                      </span>
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded font-black">
                        Radius: {deliveryRadius} km
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
