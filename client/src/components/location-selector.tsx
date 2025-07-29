
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface Province {
  id: string;
  name: string;
}

interface Regency {
  id: string;
  province_id: string;
  name: string;
}

interface District {
  id: string;
  regency_id: string;
  name: string;
}

interface Village {
  id: string;
  district_id: string;
  name: string;
}

interface LocationSelectorProps {
  value: string;
  onChange: (location: string) => void;
  required?: boolean;
}

export default function LocationSelector({ value, onChange, required }: LocationSelectorProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [regencies, setRegencies] = useState<Regency[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedRegency, setSelectedRegency] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedVillage, setSelectedVillage] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [useCustomInput, setUseCustomInput] = useState(false);
  const [customLocation, setCustomLocation] = useState("");

  // Initialize custom location from value prop
  useEffect(() => {
    if (value && !selectedProvince) {
      setCustomLocation(value);
    }
  }, [value, selectedProvince]);

  // Load provinces on component mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        setLoading(true);
        setError("");
        
        // Try multiple sources for province data
        const sources = [
          'https://raw.githubusercontent.com/hanifabd/wilayah-indonesia-area/master/data/provinces.json',
          'https://raw.githubusercontent.com/emsifa/api-wilayah-indonesia/master/api/provinces.json'
        ];
        
        let data = null;
        for (const source of sources) {
          try {
            const response = await fetch(source);
            if (response.ok) {
              data = await response.json();
              console.log("Provinces loaded from:", source);
              break;
            }
          } catch (err) {
            console.warn("Failed to load from:", source);
          }
        }
        
        if (!data) {
          // Use fallback data for major provinces in Jabodetabek area
          data = [
            { id: "31", name: "DKI Jakarta" },
            { id: "32", name: "Jawa Barat" },
            { id: "36", name: "Banten" }
          ];
          console.log("Using fallback province data");
        }
        
        setProvinces(data);
      } catch (error) {
        console.error('Error loading provinces:', error);
        setError("Gagal memuat data provinsi. Menggunakan input manual.");
        // Use fallback data
        setProvinces([
          { id: "31", name: "DKI Jakarta" },
          { id: "32", name: "Jawa Barat" },
          { id: "36", name: "Banten" }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    loadProvinces();
  }, []);

  // Load regencies when province is selected
  useEffect(() => {
    if (selectedProvince) {
      const loadRegencies = async () => {
        try {
          setLoading(true);
          setError("");
          
          const sources = [
            'https://raw.githubusercontent.com/hanifabd/wilayah-indonesia-area/master/data/regencies.json',
            'https://raw.githubusercontent.com/emsifa/api-wilayah-indonesia/master/api/regencies.json'
          ];
          
          let data = null;
          for (const source of sources) {
            try {
              const response = await fetch(source);
              if (response.ok) {
                data = await response.json();
                break;
              }
            } catch (err) {
              console.warn("Failed to load regencies from:", source);
            }
          }
          
          if (!data) {
            // Fallback regency data for major areas
            if (selectedProvince === "31") { // DKI Jakarta
              data = [
                { id: "3171", province_id: "31", name: "Jakarta Selatan" },
                { id: "3172", province_id: "31", name: "Jakarta Timur" },
                { id: "3173", province_id: "31", name: "Jakarta Pusat" },
                { id: "3174", province_id: "31", name: "Jakarta Barat" },
                { id: "3175", province_id: "31", name: "Jakarta Utara" }
              ];
            } else if (selectedProvince === "32") { // Jawa Barat
              data = [
                { id: "3201", province_id: "32", name: "Kabupaten Bogor" },
                { id: "3271", province_id: "32", name: "Kota Bogor" },
                { id: "3204", province_id: "32", name: "Kabupaten Bekasi" },
                { id: "3275", province_id: "32", name: "Kota Bekasi" },
                { id: "3216", province_id: "32", name: "Kabupaten Bekasi" },
                { id: "3276", province_id: "32", name: "Kota Depok" }
              ];
            } else if (selectedProvince === "36") { // Banten
              data = [
                { id: "3671", province_id: "36", name: "Kota Tangerang" },
                { id: "3672", province_id: "36", name: "Kota Tangerang Selatan" },
                { id: "3601", province_id: "36", name: "Kabupaten Tangerang" }
              ];
            } else {
              data = [];
            }
          }
          
          const filteredRegencies = data.filter((regency: Regency) => regency.province_id === selectedProvince);
          setRegencies(filteredRegencies);
          setDistricts([]);
          setVillages([]);
          setSelectedRegency("");
          setSelectedDistrict("");
          setSelectedVillage("");
        } catch (error) {
          console.error('Error loading regencies:', error);
          setError("Gagal memuat data kabupaten/kota");
          setRegencies([]);
        } finally {
          setLoading(false);
        }
      };
      
      loadRegencies();
    }
  }, [selectedProvince]);

  // Load districts when regency is selected
  useEffect(() => {
    if (selectedRegency) {
      const loadDistricts = async () => {
        try {
          setLoading(true);
          
          const sources = [
            'https://raw.githubusercontent.com/hanifabd/wilayah-indonesia-area/master/data/districts.json',
            'https://raw.githubusercontent.com/emsifa/api-wilayah-indonesia/master/api/districts.json'
          ];
          
          let data = null;
          for (const source of sources) {
            try {
              const response = await fetch(source);
              if (response.ok) {
                data = await response.json();
                break;
              }
            } catch (err) {
              console.warn("Failed to load districts from:", source);
            }
          }
          
          if (!data) {
            data = []; // Empty fallback for districts
          }
          
          const filteredDistricts = data.filter((district: District) => district.regency_id === selectedRegency);
          setDistricts(filteredDistricts);
          setVillages([]);
          setSelectedDistrict("");
          setSelectedVillage("");
        } catch (error) {
          console.error('Error loading districts:', error);
          setDistricts([]);
        } finally {
          setLoading(false);
        }
      };
      
      loadDistricts();
    }
  }, [selectedRegency]);

  // Load villages when district is selected
  useEffect(() => {
    if (selectedDistrict) {
      const loadVillages = async () => {
        try {
          setLoading(true);
          
          const sources = [
            'https://raw.githubusercontent.com/hanifabd/wilayah-indonesia-area/master/data/villages.json',
            'https://raw.githubusercontent.com/emsifa/api-wilayah-indonesia/master/data/villages.json'
          ];
          
          let data = null;
          for (const source of sources) {
            try {
              const response = await fetch(source);
              if (response.ok) {
                data = await response.json();
                break;
              }
            } catch (err) {
              console.warn("Failed to load villages from:", source);
            }
          }
          
          if (!data) {
            data = []; // Empty fallback for villages
          }
          
          const filteredVillages = data.filter((village: Village) => village.district_id === selectedDistrict);
          setVillages(filteredVillages);
          setSelectedVillage("");
        } catch (error) {
          console.error('Error loading villages:', error);
          setVillages([]);
        } finally {
          setLoading(false);
        }
      };
      
      loadVillages();
    }
  }, [selectedDistrict]);

  // Update parent component when location changes
  useEffect(() => {
    if (useCustomInput) {
      onChange(customLocation);
      return;
    }
    
    const provinceName = provinces.find(p => p.id === selectedProvince)?.name || "";
    const regencyName = regencies.find(r => r.id === selectedRegency)?.name || "";
    const districtName = districts.find(d => d.id === selectedDistrict)?.name || "";
    const villageName = villages.find(v => v.id === selectedVillage)?.name || "";
    
    let location = "";
    if (selectedVillage && villageName) {
      location = `${villageName}, ${districtName}, ${regencyName}, ${provinceName}`;
    } else if (selectedDistrict && districtName) {
      location = `${districtName}, ${regencyName}, ${provinceName}`;
    } else if (selectedRegency && regencyName) {
      location = `${regencyName}, ${provinceName}`;
    } else if (selectedProvince && provinceName) {
      location = provinceName;
    }
    
    onChange(location);
  }, [selectedProvince, selectedRegency, selectedDistrict, selectedVillage, provinces, regencies, districts, villages, onChange, useCustomInput, customLocation]);

  if (useCustomInput) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">Lokasi</label>
          <button
            type="button"
            onClick={() => setUseCustomInput(false)}
            className="text-sm text-blue-600 hover:underline"
          >
            Gunakan Dropdown
          </button>
        </div>
        <Input
          placeholder="Masukkan lokasi (contoh: Jakarta Selatan, DKI Jakarta)"
          value={customLocation}
          onChange={(e) => setCustomLocation(e.target.value)}
          required={required}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">Lokasi</label>
        <button
          type="button"
          onClick={() => {
            setUseCustomInput(true);
            setCustomLocation(value || "");
          }}
          className="text-sm text-blue-600 hover:underline"
        >
          Input Manual
        </button>
      </div>
      
      {error && (
        <div className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Province Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Provinsi</label>
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="w-full border rounded p-2"
            required={required}
            disabled={loading}
          >
            <option value="">-- Pilih Provinsi --</option>
            {provinces.map((province) => (
              <option key={province.id} value={province.id}>
                {province.name}
              </option>
            ))}
          </select>
        </div>

        {/* Regency Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kabupaten/Kota</label>
          <select
            value={selectedRegency}
            onChange={(e) => setSelectedRegency(e.target.value)}
            className="w-full border rounded p-2"
            disabled={!selectedProvince || loading}
          >
            <option value="">-- Pilih Kabupaten/Kota --</option>
            {regencies.map((regency) => (
              <option key={regency.id} value={regency.id}>
                {regency.name}
              </option>
            ))}
          </select>
        </div>

        {/* District Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kecamatan (Opsional)</label>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full border rounded p-2"
            disabled={!selectedRegency || loading}
          >
            <option value="">-- Pilih Kecamatan --</option>
            {districts.map((district) => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>
        </div>

        {/* Village Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kelurahan/Desa (Opsional)</label>
          <select
            value={selectedVillage}
            onChange={(e) => setSelectedVillage(e.target.value)}
            className="w-full border rounded p-2"
            disabled={!selectedDistrict || loading}
          >
            <option value="">-- Pilih Kelurahan/Desa --</option>
            {villages.map((village) => (
              <option key={village.id} value={village.id}>
                {village.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Display selected location */}
      {value && (
        <div className="mt-2 p-2 bg-gray-50 rounded border">
          <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi Lengkap:</label>
          <p className="text-sm text-gray-600">{value}</p>
        </div>
      )}
      
      {loading && (
        <p className="text-sm text-blue-600">Memuat data wilayah...</p>
      )}
    </div>
  );
}
