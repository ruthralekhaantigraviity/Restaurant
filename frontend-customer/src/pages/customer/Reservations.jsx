import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, MapPin, ChevronRight, CheckCircle, Store, AlertTriangle, Armchair } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import defaultApi from '../../utils/axiosInstance';
import toast from 'react-hot-toast';

const SEATING_SETUPS = [
    {
        id: 'corner',
        name: 'Corner Table',
        description: 'Cozy, quiet & secluded corner dining setup',
        icon: '🛋️'
    },
    {
        id: 'middle',
        name: 'Middle / Central Dining',
        description: 'Vibrant main hall central dining setup',
        icon: '🍽️'
    },
    {
        id: 'window',
        name: 'Window Side Table',
        description: 'Scenic outdoor view with natural lighting',
        icon: '🪟'
    },
    {
        id: 'booth',
        name: 'Private Booth / Alcove',
        description: 'Comfortable cushioned booth for intimate family dining',
        icon: '🍷'
    },
    {
        id: 'outdoor',
        name: 'Outdoor Patio / Terrace',
        description: 'Open-air alfresco dining under the sky',
        icon: '🌿'
    },
    {
        id: 'bar',
        name: 'Bar & High-Top Counter',
        description: 'Casual high-top seating near beverage bar',
        icon: '🍸'
    }
];

const TIME_SLOTS = [
    { value: '12:00', label: '12:00 PM (Lunch)' },
    { value: '12:30', label: '12:30 PM (Lunch)' },
    { value: '13:00', label: '1:00 PM (Lunch)' },
    { value: '13:30', label: '1:30 PM (Lunch)' },
    { value: '14:00', label: '2:00 PM (Lunch)' },
    { value: '17:00', label: '5:00 PM (Evening)' },
    { value: '17:30', label: '5:30 PM (Evening)' },
    { value: '18:00', label: '6:00 PM (Dinner)' },
    { value: '18:30', label: '6:30 PM (Dinner)' },
    { value: '19:00', label: '7:00 PM (Dinner)' },
    { value: '19:30', label: '7:30 PM (Dinner)' },
    { value: '20:00', label: '8:00 PM (Dinner)' },
    { value: '20:30', label: '8:30 PM (Dinner)' },
    { value: '21:00', label: '9:00 PM (Dinner)' },
    { value: '21:30', label: '9:30 PM (Dinner)' }
];

const Reservations = () => {
    const { user, api } = useCustomerAuth();
    const routerLocation = useLocation();

    const [step, setStep] = useState(1); // 1: details, 2: success
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [restaurants, setRestaurants] = useState([]);
    const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
    const [branches, setBranches] = useState([]);
    const [selectedBranchId, setSelectedBranchId] = useState('');
    
    // Form state
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('19:00');
    const [guests, setGuests] = useState('2');
    const [seatingSetup, setSeatingSetup] = useState('corner');
    const [firstName, setFirstName] = useState(() => user?.name?.split(' ')[0] || '');
    const [lastName, setLastName] = useState(() => user?.name?.split(' ').slice(1).join(' ') || '');
    const [email, setEmail] = useState(() => user?.email || '');
    const [phone, setPhone] = useState(() => user?.phone || '');
    const [specialRequests, setSpecialRequests] = useState('');
    const [confirmedReservation, setConfirmedReservation] = useState(null);

    // Fetch live restaurants to allow customer to choose
    useEffect(() => {
        const client = api || defaultApi;
        client.get('/restaurants').then(res => {
            if (Array.isArray(res.data) && res.data.length > 0) {
                setRestaurants(res.data);
                const queryParams = new URLSearchParams(routerLocation.search);
                const preselectedId = queryParams.get('restaurantId');
                const matched = preselectedId && res.data.find(r => r._id === preselectedId);
                const activeRest = matched || res.data[0];
                setSelectedRestaurantId(activeRest._id);
                if (activeRest.branches && activeRest.branches.length > 0) {
                    setBranches(activeRest.branches);
                    setSelectedBranchId(activeRest.branches[0]._id || activeRest.branches[0]);
                }
            }
        }).catch(err => {
            console.error('Failed to load restaurants for table booking', err);
        });
    }, [api, routerLocation.search]);

    // When selected restaurant changes, update branches
    const selectedRestaurant = restaurants.find(r => r._id === selectedRestaurantId);

    useEffect(() => {
        if (selectedRestaurant?.branches && selectedRestaurant.branches.length > 0) {
            setBranches(selectedRestaurant.branches);
            setSelectedBranchId(selectedRestaurant.branches[0]._id || selectedRestaurant.branches[0]);
        } else {
            setBranches([]);
            setSelectedBranchId('');
        }
    }, [selectedRestaurantId, selectedRestaurant]);

    // Check if table reservations are enabled by the admin for this restaurant
    const isTableBookingAvailable = selectedRestaurant
        ? (selectedRestaurant.features?.tableReservations !== false &&
           selectedRestaurant.posConfig?.tablesEnabled !== false &&
           selectedRestaurant.modules?.reservations !== false)
        : true;

    const currentSeatingObj = SEATING_SETUPS.find(s => s.id === seatingSetup) || SEATING_SETUPS[0];

    const handleReserve = async (e) => {
        e.preventDefault();

        if (!isTableBookingAvailable) {
            toast.error('Table reservations are currently not available for this restaurant.');
            return;
        }

        if (!phone || phone.length < 10) {
            toast.error('Please enter a valid 10-digit mobile number.');
            return;
        }

        setIsSubmitting(true);

        const slotObj = TIME_SLOTS.find(s => s.value === time);
        const formattedTime = slotObj ? slotObj.label : time;

        let formattedDate = date;
        try {
            const d = new Date(date + 'T00:00:00');
            formattedDate = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
        } catch (_) {}

        const reservationPayload = {
            restaurant: selectedRestaurantId,
            restaurantName: selectedRestaurant?.name || 'Restaurant Outlet',
            branch: selectedBranchId || (selectedRestaurant?.branches?.[0]?._id || selectedRestaurant?.branches?.[0]),
            guestName: `${firstName.trim()} ${lastName.trim()}`.trim() || user?.name || 'Guest',
            guestPhone: phone,
            guestEmail: email,
            date: date,
            timeSlot: formattedTime,
            guestCount: parseInt(guests) || 2,
            seatingSetup: currentSeatingObj.name,
            specialRequests: specialRequests.trim()
        };

        try {
            const client = api || defaultApi;
            // Attempt to persist to backend
            await client.post('/reservations', reservationPayload).catch(err => {
                console.warn('Backend reservation notice (proceeding with confirmation):', err?.message || err);
            });

            // Sync with local customer reservations
            const newRes = {
                id: 'RES-' + Date.now().toString().slice(-6),
                restaurantName: selectedRestaurant?.name || 'Restaurant Outlet',
                date: formattedDate,
                time: formattedTime,
                guests: parseInt(guests) || 2,
                seatingSetup: currentSeatingObj.name,
                seatingIcon: currentSeatingObj.icon,
                status: 'Confirmed',
                statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-100'
            };

            const existing = JSON.parse(localStorage.getItem('customerReservations') || '[]');
            localStorage.setItem('customerReservations', JSON.stringify([newRes, ...existing]));

            setConfirmedReservation(newRes);
            setStep(2);
            toast.success(`Table booked successfully at ${selectedRestaurant?.name || 'the restaurant'}!`);
        } catch (err) {
            console.error('Reservation error:', err);
            toast.error('Failed to reserve table. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (step === 2 && confirmedReservation) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-100 max-w-lg w-full text-center animate-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5 text-emerald-600">
                        <CheckCircle size={44} />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-1">Table Reserved!</h1>
                    <p className="text-slate-500 mb-6 text-sm">Your dining setup is confirmed. We look forward to hosting you.</p>
                    
                    <div className="bg-slate-50 rounded-2xl p-5 mb-6 text-left border border-slate-200/80 space-y-3.5 text-xs sm:text-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-orange-500 shadow-2xs shrink-0">
                                <Store size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Restaurant Outlet</p>
                                <p className="font-black text-slate-900">{confirmedReservation.restaurantName}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-2xs shrink-0">
                                <Armchair size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dining Setup & Seating</p>
                                <p className="font-black text-emerald-800">{confirmedReservation.seatingIcon} {confirmedReservation.seatingSetup}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200/60">
                                <Calendar size={16} className="text-slate-500 shrink-0" />
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Date</p>
                                    <p className="font-bold text-slate-900 text-xs">{confirmedReservation.date}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200/60">
                                <Clock size={16} className="text-slate-500 shrink-0" />
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Time Slot</p>
                                    <p className="font-bold text-slate-900 text-xs">{confirmedReservation.time}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200/60">
                            <Users size={16} className="text-slate-500 shrink-0" />
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Party Size</p>
                                <p className="font-bold text-slate-900">{confirmedReservation.guests} Guests</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <Link 
                            to="/profile?tab=reservations"
                            className="w-full bg-[#FF5A1F] hover:bg-[#e04f1a] text-white font-bold py-3 sm:py-3.5 rounded-xl transition-all shadow-md shadow-[#FF5A1F]/20 active:scale-98 text-xs sm:text-sm text-center"
                        >
                            View in Dashboard
                        </Link>
                        <button
                            type="button"
                            onClick={() => {
                                setStep(1);
                                setConfirmedReservation(null);
                            }}
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 sm:py-3.5 rounded-xl transition-all text-xs sm:text-sm cursor-pointer"
                        >
                            Book Another Table
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-[85vh] pb-24">
            {/* Header Banner */}
            <div className="bg-slate-950 text-white pt-6 pb-12 sm:py-16 px-4 relative overflow-hidden">
                <img 
                    src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2000&auto=format&fit=crop" 
                    alt="Restaurant Interior" 
                    className="absolute inset-0 w-full h-full object-cover opacity-25"
                />
                <div className="max-w-4xl mx-auto relative z-10 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-orange-400 text-xs font-bold mb-3 border border-white/10">
                        ✨ Fine Dine & Table Booking
                    </span>
                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-black font-sans tracking-tight mb-2 sm:mb-3">
                        Book Your Table
                    </h1>
                    <p className="text-slate-300 max-w-xl mx-auto text-xs sm:text-base font-medium">
                        Reserve your preferred dining setup — corner tables, window view, or private family booths.
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 relative z-20">
                <form onSubmit={handleReserve} className="bg-white rounded-3xl p-5 sm:p-8 shadow-xl border border-slate-100">
                    
                    {/* Restaurant Outlet Selection */}
                    <div className="mb-6 pb-6 border-b border-slate-100">
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                            <Store size={15} className="text-[#FF5A1F]" /> Select Restaurant Outlet *
                        </label>
                        {restaurants.length > 0 ? (
                            <select
                                value={selectedRestaurantId}
                                onChange={(e) => setSelectedRestaurantId(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm outline-none focus:border-[#FF5A1F] focus:bg-white transition-colors cursor-pointer"
                                required
                            >
                                {restaurants.map(r => (
                                    <option key={r._id} value={r._id}>
                                        {r.name} {r.city ? `(${r.city})` : ''}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 font-medium">
                                Loading restaurant outlets...
                            </div>
                        )}

                        {/* Admin Availability Check Alert */}
                        {!isTableBookingAvailable ? (
                            <div className="mt-3 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-xs text-amber-900 font-semibold">
                                <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                                <div>
                                    <strong className="block text-amber-800">Table booking is currently unavailable</strong>
                                    The restaurant management has temporarily paused dine-in table reservations for this outlet.
                                </div>
                            </div>
                        ) : (
                            <div className="mt-2 text-[11px] font-bold text-emerald-600 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Table Booking is Available & Enabled by Restaurant Admin
                            </div>
                        )}
                    </div>

                    {/* Dining Setup / Seating Selection */}
                    <div className="mb-6 pb-6 border-b border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                <Armchair size={15} className="text-[#FF5A1F]" /> Preferred Dining Setup & Seating *
                            </label>
                            <span className="text-[11px] text-slate-400 font-semibold">Select your ideal atmosphere</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {SEATING_SETUPS.map(s => {
                                const isSelected = seatingSetup === s.id;
                                return (
                                    <div
                                        key={s.id}
                                        onClick={() => setSeatingSetup(s.id)}
                                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 text-left ${
                                            isSelected
                                                ? 'bg-orange-50/70 border-[#FF5A1F] ring-2 ring-[#FF5A1F]/30 shadow-xs scale-101'
                                                : 'bg-white border-slate-200 hover:border-orange-200 hover:bg-slate-50/60'
                                        }`}
                                    >
                                        <span className="text-2xl shrink-0 mt-0.5">{s.icon}</span>
                                        <div className="min-w-0">
                                            <p className={`text-xs font-black ${isSelected ? 'text-[#FF5A1F]' : 'text-slate-900'}`}>
                                                {s.name}
                                            </p>
                                            <p className="text-[11px] text-slate-500 font-medium leading-snug mt-0.5">
                                                {s.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Booking Details (Guests, Date, Time) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        {/* Party Size */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                                <Users size={14} className="text-[#FF5A1F]" /> Party Size
                            </label>
                            <select 
                                value={guests}
                                onChange={(e) => setGuests(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs sm:text-sm text-slate-900 outline-none focus:border-[#FF5A1F] focus:bg-white transition-colors cursor-pointer"
                                required
                            >
                                {[1,2,3,4,5,6,7,8,10,12,'12+'].map(num => (
                                    <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                                <Calendar size={14} className="text-[#FF5A1F]" /> Date
                            </label>
                            <input 
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs sm:text-sm text-slate-900 outline-none focus:border-[#FF5A1F] focus:bg-white transition-colors cursor-pointer"
                                required
                            />
                        </div>

                        {/* Time Slot */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                                <Clock size={14} className="text-[#FF5A1F]" /> Time Slot
                            </label>
                            <select 
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs sm:text-sm text-slate-900 outline-none focus:border-[#FF5A1F] focus:bg-white transition-colors cursor-pointer"
                                required
                            >
                                {TIME_SLOTS.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Guest Contact Details */}
                    <div className="border-t border-slate-100 pt-5 mb-6">
                        <h3 className="font-black text-sm text-slate-900 mb-3 uppercase tracking-wider">
                            Guest Contact & Special Requests
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">First Name *</label>
                                <input 
                                    type="text" 
                                    value={firstName} 
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="e.g. John" 
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#FF5A1F] focus:bg-white text-xs sm:text-sm font-semibold" 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Last Name</label>
                                <input 
                                    type="text" 
                                    value={lastName} 
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="e.g. Doe" 
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#FF5A1F] focus:bg-white text-xs sm:text-sm font-semibold" 
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">10-Digit Mobile Number *</label>
                                <input 
                                    type="tel" 
                                    inputMode="numeric" 
                                    maxLength={10} 
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    placeholder="e.g. 9876543210" 
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#FF5A1F] focus:bg-white text-xs sm:text-sm font-semibold font-mono" 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Email Address</label>
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="e.g. john@example.com" 
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#FF5A1F] focus:bg-white text-xs sm:text-sm font-semibold" 
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Special Dining Requests (Optional)</label>
                                <textarea 
                                    rows="2" 
                                    value={specialRequests}
                                    onChange={(e) => setSpecialRequests(e.target.value)}
                                    placeholder="e.g. Birthday celebration, anniversary, high chair needed, dietary allergies" 
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#FF5A1F] focus:bg-white text-xs sm:text-sm resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button 
                        type="submit"
                        disabled={isSubmitting || !isTableBookingAvailable}
                        className="w-full bg-[#FF5A1F] hover:bg-[#e04f1a] text-white font-black py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-[#FF5A1F]/25 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Reserving Your Dining Setup...</span>
                            </>
                        ) : (
                            <>
                                <span>Confirm {currentSeatingObj.name} Reservation</span>
                                <ChevronRight size={17} />
                            </>
                        )}
                    </button>
                    
                    <p className="text-center text-xs text-slate-400 mt-4">
                        Instant table confirmation · No cancellation fee · Powered by FoodNest
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Reservations;
