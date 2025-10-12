/* global jQuery */
(function($){
  // jQuery-based PSGC selector: province -> city/municipality -> barangay
  // Uses PSGC GitLab JSONs and localStorage caching (7d TTL). Mirrors previous behavior.

  const $province = $('#province');
  const $city = $('#city');
  const $barangay = $('#barangay');
  if ($province.length === 0) return;

  function clear($select, txt){
    $select.empty();
    $select.append($('<option>').attr('value','').text(txt || 'Choose...'));
  }

  function setLoading($select, loading){
    if (loading) {
      $select.prop('disabled', true);
      clear($select, 'Loading...');
    } else {
      $select.prop('disabled', false);
    }
  }

  const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
  function loadFromLocal(key){
    try{
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.ts || !parsed.data) return null;
      if (Date.now() - parsed.ts > CACHE_TTL_MS) { localStorage.removeItem(key); return null; }
      return parsed.data;
    } catch(e){ console.warn('local load err', key, e); return null; }
  }
  function saveToLocal(key, data){
    try{ localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch(e){ console.warn('local save err', e); }
  }

  const cache = { provinces: null, municipalities: null, cities: null, barangays: null };

  function loadProvinces(){
    if (cache.provinces) { populateProvinces(cache.provinces); return $.Deferred().resolve(cache.provinces).promise(); }
    const local = loadFromLocal('psgc_provinces');
    if (local) { cache.provinces = local; populateProvinces(local); return $.Deferred().resolve(local).promise(); }
    setLoading($province, true);
    return $.getJSON('https://psgc.gitlab.io/api/provinces.json')
      .then(function(data){
        data.sort((a,b)=> a.name.localeCompare(b.name));
        cache.provinces = data; saveToLocal('psgc_provinces', data); populateProvinces(data); return data;
      })
      .fail(function(err){ console.error('Failed provinces', err); clear($province, 'Failed to load'); return []; })
      .always(function(){ setLoading($province, false); });
  }

  function populateProvinces(list){ clear($province); list.forEach(p => $province.append($('<option>').val(p.code).text(p.name))); }

  function loadMunicipalities(){
    if (cache.municipalities) return $.Deferred().resolve(cache.municipalities).promise();
    const local = loadFromLocal('psgc_municipalities');
    if (local) { cache.municipalities = local; return $.Deferred().resolve(local).promise(); }
    return $.getJSON('https://psgc.gitlab.io/api/municipalities.json')
      .then(function(data){ cache.municipalities = data; saveToLocal('psgc_municipalities', data); return data; })
      .catch(function(err){ console.error('Failed municipalities', err); cache.municipalities = []; return []; });
  }

  function loadCities(){
    if (cache.cities) return $.Deferred().resolve(cache.cities).promise();
    const local = loadFromLocal('psgc_cities');
    if (local) { cache.cities = local; return $.Deferred().resolve(local).promise(); }
    return $.getJSON('https://psgc.gitlab.io/api/cities.json')
      .then(function(data){ cache.cities = data; saveToLocal('psgc_cities', data); return data; })
      .catch(function(err){ console.error('Failed cities', err); cache.cities = []; return []; });
  }

  function loadBarangays(){
    if (cache.barangays) return $.Deferred().resolve(cache.barangays).promise();
    const local = loadFromLocal('psgc_barangays');
    if (local) { cache.barangays = local; return $.Deferred().resolve(local).promise(); }
    return $.getJSON('https://psgc.gitlab.io/api/barangays.json')
      .then(function(data){ cache.barangays = data; saveToLocal('psgc_barangays', data); return data; })
      .catch(function(err){ console.error('Failed barangays', err); cache.barangays = []; return []; });
  }

  $province.on('change', function(){
    const provinceCode = $(this).val();
    clear($city); clear($barangay); $city.prop('disabled', true); $barangay.prop('disabled', true);
    if (!provinceCode) return;
    setLoading($city, true);
    $.when(loadMunicipalities(), loadCities()).then(function(munList, cityList){
      // jQuery unwraps promises; actual arrays are first arg
      munList = Array.isArray(munList[0]) ? munList[0] : munList;
      cityList = Array.isArray(cityList[0]) ? cityList[0] : cityList;
      const munMatches = (munList||[]).filter(m=>m.provinceCode===provinceCode);
      const cityMatches = (cityList||[]).filter(c=>c.provinceCode===provinceCode);
      const matches = munMatches.concat(cityMatches).sort((a,b)=> a.name.localeCompare(b.name));
      if (!matches.length) { clear($city,'N/A'); setLoading($city,false); return; }
      matches.forEach(it=> $city.append($('<option>').val(it.code).text(it.name)));
      $city.prop('disabled', false); setLoading($city,false);
    });
  });

  $city.on('change', function(){
    const placeCode = $(this).val();
    clear($barangay); $barangay.prop('disabled', true);
    if (!placeCode) return;
    setLoading($barangay, true);
    loadBarangays().then(function(list){
      const matches = (list||[]).filter(b => b.municipalityCode===placeCode || b.cityCode===placeCode).sort((a,b)=> a.name.localeCompare(b.name));
      if (!matches.length) { clear($barangay,'N/A'); setLoading($barangay,false); return; }
      matches.forEach(b => $barangay.append($('<option>').val(b.code).text(b.name)));
      $barangay.prop('disabled', false); setLoading($barangay,false);
    });
  });

  // initialize
  clear($city); clear($barangay); setLoading($city,false); setLoading($barangay,false);
  $(function(){ loadProvinces(); });

})(jQuery);