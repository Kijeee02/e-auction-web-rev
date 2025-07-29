
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

  // Load provinces on component mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://raw.githubusercontent.com/hanifabd/wilayah-indonesia-area/master/data/provinces.json');
        const data = await response.json();
        setProvinces(data);
      } catch (error) {
        console.error('Error loading provinces:', error);
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
          const response = await fetch('https://raw.githubusercontent.com/hanifabd/wilayah-indonesia-area/master/data/regencies.json');
          const data = await response.json();
          const filteredRegencies = data.filter((regency: Regency) => regency.province_id === selectedProvince);
          setRegencies(filteredRegencies);
          setDistricts([]);
          setVillages([]);
          setSelectedRegency("");
          setSelectedDistrict("");
          setSelectedVillage("");
        } catch (error) {
          console.error('Error loading regencies:', error);
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
          const response = await fetch('https://raw.githubusercontent.com/hanifabd/wilayah-indonesia-area/master/data/districts.json');
          const data = await response.json();
          const filteredDistricts = data.filter((district: District) => district.regency_id === selectedRegency);
          setDistricts(filteredDistricts);
          setVillages([]);
          setSelectedDistrict("");
          setSelectedVillage("");
        } catch (error) {
          console.error('Error loading districts:', error);
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
          const response = await fetch('https://raw.githubusercontent.com/hanifabd/wilayah-indonesia-area/master/data/villages.json');
          const data = await response.json();
          const filteredVillages = data.filter((village: Village) => village.district_id === selectedDistrict);
          setVillages(filteredVillages);
          setSelectedVillage("");
        } catch (error) {
          console.error('Error loading villages:', error);
        } finally {
          setLoading(false);
        }
      };
      
      loadVillages();
    }
  }, [selectedDistrict]);

  // Update parent component when location changes
  useEffect(() => {
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
  }, [selectedProvince, selectedRegency, selectedDistrict, selectedVillage, provinces, regencies, districts, villages, onChange]);

  return (
    <div className="space-y-3">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Kecamatan</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Kelurahan/Desa</label>
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
