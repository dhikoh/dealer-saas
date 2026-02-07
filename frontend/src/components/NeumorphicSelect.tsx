import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faGlobe } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface Option {
    code: string;
    label: string;
}

interface NeumorphicSelectProps {
    value: string;
    onChange: (name: string, value: string) => void;
    options: Option[];
    name: string;
    icon?: IconDefinition;
    placeholder?: string;
}

export default function NeumorphicSelect({
    value,
    onChange,
    options,
    name,
    icon,
    placeholder = "Select Option"
}: NeumorphicSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const selectedOption = options.find(opt => opt.code === value);

    return (
        <div className="relative" ref={dropdownRef}>
            {icon && (
                <FontAwesomeIcon
                    icon={icon}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555] text-lg z-10"
                />
            )}

            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full h-12 ${icon ? 'pl-12' : 'pl-4'} pr-4 rounded-[50px] bg-[#ecf0f3] shadow-[inset_5px_5px_10px_#cbced1,inset_-5px_-5px_10px_#ffffff] flex items-center justify-between cursor-pointer text-[#1b1b1b] select-none hover:shadow-[inset_2px_2px_5px_#cbced1,inset_-2px_-2px_5px_#ffffff,0_0_0_2px_#00bfa5] transition-all`}
            >
                <span>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`text-xs text-[#555] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-14 left-0 w-full p-4 rounded-[20px] bg-[#ecf0f3] shadow-[13px_13px_20px_#cbced1,-13px_-13px_20px_#ffffff] z-50 flex flex-col gap-2 max-h-60 overflow-y-auto">
                    {options.map((opt) => (
                        <div
                            key={opt.code}
                            onClick={() => {
                                onChange(name, opt.code);
                                setIsOpen(false);
                            }}
                            className={`p-3 rounded-[15px] cursor-pointer transition-all ${value === opt.code
                                    ? 'shadow-[inset_5px_5px_10px_#cbced1,inset_-5px_-5px_10px_#ffffff] text-[#00bfa5] font-bold'
                                    : 'hover:bg-[#e6e9ef] text-[#555]'
                                }`}
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
