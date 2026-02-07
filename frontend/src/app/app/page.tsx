'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faFileExport, faGasPump, faMapMarkerAlt, faBookmark } from '@fortawesome/free-solid-svg-icons';

// DUMMY DATA FOR LISTING
const CARS = [
    { id: 1, name: "Hyundai S Turbo uMT", price: "$285,892", km: "1028 KM", fuel: "Petrol", loc: "Dubai", seller: "Jonson Hussain", img: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=300&h=200" },
    { id: 2, name: "Bentley Flying Spur", price: "$285,892", km: "5891 KM", fuel: "Petrol", loc: "Dubai", seller: "Albert Jack", img: "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=300&h=200" },
    { id: 3, name: "Porsche Taycan", price: "Call for Price", km: "369 KM", fuel: "Electric", loc: "Dubai", seller: "Robert Rome", img: "https://images.unsplash.com/photo-1503376763036-066120622c74?auto=format&fit=crop&q=80&w=300&h=200" },
    { id: 4, name: "Hyundai S Turbo uMT", price: "$285,892", km: "2180 KM", fuel: "Petrol", loc: "Dubai", seller: "Smith Hasan", img: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=300&h=200" },
    { id: 5, name: "Bentley Flying Spur", price: "$285,892", km: "3690 KM", fuel: "Petrol", loc: "China", seller: "Hussain Jahan", img: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=300&h=200" },
    { id: 6, name: "Panamera Platinum", price: "$285,892", km: "1471 KM", fuel: "Petrol", loc: "Dubai", seller: "Amit Rahman", img: "https://images.unsplash.com/photo-1619682817481-e994891cd1f5?auto=format&fit=crop&q=80&w=300&h=200" },
];

export default function DashboardPage() {
    return (
        <div>
            {/* PAGE HEADER */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Vehicle Listing</h1>
                    <p className="text-sm text-gray-500 mt-1">Get your latest update for the last 7 days</p>
                </div>
                <div className="flex gap-4">
                    <button className="px-6 py-2 rounded-xl bg-[#ecf0f3] text-gray-600 font-medium shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] hover:text-[#00bfa5] active:shadow-[inset_2px_2px_5px_#cbced1,inset_-2px_-2px_5px_#ffffff] transition-all flex items-center gap-2">
                        <FontAwesomeIcon icon={faFilter} size="sm" />
                        Filter By
                    </button>
                    <button className="px-6 py-2 rounded-xl bg-[#00bfa5] text-white font-medium shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] hover:bg-[#00a891] active:translate-y-[1px] transition-all flex items-center gap-2">
                        <FontAwesomeIcon icon={faFileExport} size="sm" />
                        Export
                    </button>
                </div>
            </div>

            {/* LISTING GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {CARS.map((car) => (
                    <div key={car.id} className="bg-[#ecf0f3] rounded-2xl p-4 shadow-[9px_9px_16px_#cbced1,-9px_-9px_16px_#ffffff] hover:shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff] transition-all duration-300 group">
                        {/* SELLER INFO */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <img src={`https://ui-avatars.com/api/?name=${car.seller}&background=random`} className="w-8 h-8 rounded-full shadow-sm" alt="Seller" />
                                <span className="text-sm font-semibold text-gray-700">{car.seller}</span>
                            </div>
                            <FontAwesomeIcon icon={faBookmark} className="text-gray-400 hover:text-[#00bfa5] cursor-pointer" />
                        </div>

                        {/* CAR IMAGE */}
                        <div className="h-40 rounded-xl overflow-hidden mb-4 shadow-[inset_2px_2px_5px_#cbced1,inset_-2px_-2px_5px_#ffffff] relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={car.img} alt={car.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>

                        {/* DETAILS */}
                        <h3 className="text-lg font-bold text-gray-800 mb-2">{car.name}</h3>

                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                            <div className="flex items-center gap-1">
                                <span className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center text-[0.6rem] text-[#00bfa5]">Km</span>
                                {car.km}
                            </div>
                            <div className="flex items-center gap-1">
                                <FontAwesomeIcon icon={faGasPump} className="text-[#00bfa5]" />
                                {car.fuel}
                            </div>
                            <div className="flex items-center gap-1">
                                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[#00bfa5]" />
                                {car.loc}
                            </div>
                        </div>

                        <div className="border-t border-gray-300 pt-3 flex items-center justify-between">
                            <div className="text-xs text-gray-400">Fixed Price</div>
                            <div className="text-lg font-bold text-[#00bfa5]">{car.price}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
