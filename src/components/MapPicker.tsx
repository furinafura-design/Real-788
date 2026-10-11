import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, ExternalLink, Search } from 'lucide-react';
import L from 'leaflet';
import { LocationCoords } from '../types';

interface MapPickerProps {
  coords: LocationCoords;
  onChangeCoords: (coords: LocationCoords) => void;
  onAddressAutoFill?: (address: string) => void;
}

export const MapPicker: React.FC<MapPickerProps> = ({
  coords,
  onChangeCoords,
  onAddressAutoFill,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [addressPreview, setAddressPreview] = useState(coords.addressHint || 'กรุงเทพมหานคร');
  const [isLocating, setIsLocating] = useState(false);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Create map
      const map = L.map(mapContainerRef.current, {
        center: [coords.lat || 13.7563, coords.lng || 100.5018],
        zoom: 14,
        zoomControl: true,
      });

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Custom luxury marker icon
      const customIcon = L.divIcon({
        className: 'custom-pin',
        html: `<div style="background: linear-gradient(135deg, #740E60, #96287F); width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 14px rgba(116, 14, 96, 0.45);">
                 <div style="width: 10px; height: 10px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
               </div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
      });

      // Add draggable marker
      const marker = L.marker([coords.lat || 13.7563, coords.lng || 100.5018], {
        icon: customIcon,
        draggable: true,
      }).addTo(map);

      // Listen for dragend
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        handleUpdateLocation(position.lat, position.lng);
      });

      // Listen for click on map
      map.on('click', (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        handleUpdateLocation(e.latlng.lat, e.latlng.lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  const handleUpdateLocation = async (lat: number, lng: number) => {
    const latRounded = Number(lat.toFixed(5));
    const lngRounded = Number(lng.toFixed(5));

    // Try reverse geocoding via OpenStreetMap Nominatim for Thai address hint
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=th`,
        { headers: { 'User-Agent': 'ManawHomolusECommerce/1.0' } }
      );
      if (res.ok) {
        const data = await res.json();
        const display = data.display_name || `${latRounded}, ${lngRounded}`;
        setAddressPreview(display);
        onChangeCoords({ lat: latRounded, lng: lngRounded, addressHint: display });
        if (onAddressAutoFill) {
          onAddressAutoFill(display);
        }
        return;
      }
    } catch {
      // Fallback
    }

    const hint = `พิกัดละติจูด: ${latRounded}, ลองจิจูด: ${lngRounded}`;
    setAddressPreview(hint);
    onChangeCoords({ lat: latRounded, lng: lngRounded, addressHint: hint });
  };

  // Get User Current Location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง GPS');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16);
          markerRef.current.setLatLng([lat, lng]);
          handleUpdateLocation(lat, lng);
        }
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error', err);
        setIsLocating(false);
        alert('ไม่สามารถดึงตำแหน่งปัจจุบันได้ กรุณาคลิกเลือกตำแหน่งบนแผนที่โดยตรง');
      },
      { timeout: 10000 }
    );
  };

  // Preset location setter
  const setPreset = (lat: number, lng: number, name: string) => {
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([lat, lng], 15);
      markerRef.current.setLatLng([lat, lng]);
      handleUpdateLocation(lat, lng);
    }
  };

  const googleMapsUrl = `https://www.google.com/maps?q=${coords.lat || 13.7563},${coords.lng || 100.5018}`;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <label className="font-bold text-[#740E60] flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-[#96287F]" />
          <span>ปักหมุดตำแหน่งจัดส่ง (Google Maps / Interactive Map):</span>
        </label>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          className="text-[#740E60] hover:text-[#96287F] font-semibold flex items-center gap-1 bg-[#FAF6F9] px-2.5 py-1 rounded-lg border border-[#ECC5DC] text-[11px] shadow-2xs"
        >
          <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'กำลังค้นหา...' : 'ปักหมุดตำแหน่งฉัน'}</span>
        </button>
      </div>

      {/* Preset quick buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-1">
        <span className="text-gray-400 shrink-0 text-[10px]">ลัดไปจุดสำคัญ:</span>
        <button
          type="button"
          onClick={() => setPreset(13.7445, 100.5332, 'สยามสแควร์ กทม.')}
          className="px-2 py-0.5 rounded-full bg-white border border-[#ECC5DC] text-gray-700 hover:bg-[#FAF6F9] shrink-0"
        >
          สยามสแควร์
        </button>
        <button
          type="button"
          onClick={() => setPreset(13.7367, 100.5608, 'อโศก สุขุมวิท')}
          className="px-2 py-0.5 rounded-full bg-white border border-[#ECC5DC] text-gray-700 hover:bg-[#FAF6F9] shrink-0"
        >
          อโศก/สุขุมวิท
        </button>
        <button
          type="button"
          onClick={() => setPreset(13.7844, 100.5451, 'อารีย์')}
          className="px-2 py-0.5 rounded-full bg-white border border-[#ECC5DC] text-gray-700 hover:bg-[#FAF6F9] shrink-0"
        >
          อารีย์
        </button>
        <button
          type="button"
          onClick={() => setPreset(18.7883, 98.9853, 'เชียงใหม่')}
          className="px-2 py-0.5 rounded-full bg-white border border-[#ECC5DC] text-gray-700 hover:bg-[#FAF6F9] shrink-0"
        >
          เชียงใหม่
        </button>
      </div>

      {/* Map Container */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-[#ECC5DC] shadow-inner bg-[#FAF6F9]">
        <div ref={mapContainerRef} className="h-44 w-full z-10" />

        {/* Floating guidance overlay */}
        <div className="absolute top-2 left-2 z-20 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md text-[10px] font-medium text-gray-700 shadow-xs border border-gray-200">
          💡 คลิกหรือลากหมุดสีม่วงเพื่อระบุจุดส่งพัสดุ
        </div>
      </div>

      {/* Coordinates readout and Google Maps external link */}
      <div className="p-2.5 rounded-xl bg-[#FAF6F9] border border-[#ECC5DC] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
        <div className="truncate">
          <span className="text-gray-500">พิกัดหมุด: </span>
          <span className="font-mono font-bold text-[#740E60]">
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </span>
          {addressPreview && (
            <p className="text-gray-600 truncate max-w-sm mt-0.5">{addressPreview}</p>
          )}
        </div>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#740E60] hover:text-[#96287F] font-semibold flex items-center gap-1 shrink-0 self-start sm:self-auto bg-white px-2 py-1 rounded-lg border border-[#ECC5DC]"
        >
          <span>เปิดใน Google Maps</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
