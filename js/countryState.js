/**
 * =============================================================================
 * File: js/countryState.js
 * Purpose: The "Address Selector" (Cascading Dropdowns).
 * =============================================================================
 *
 * NOTE:
 * Picking an address is a "Waterfall" (Cascade) process:
 *   1. You pick a Province.
 *   2. Based on that Province, we show only relevant Cities.
 *   3. Based on that City, we show only relevant Barangays.
 *
 * We use an API (PSGC) to get this data.
 * Optimization: Since Provinces/Cities rarely change, we save them in
 * `localStorage` (Cache) for 30 days so the dropdowns load instantly next time.
 * =============================================================================
 */

(function ($) {
  "use strict";

  // ---------------------------------------------------------------------------
  // STEP 1: FIND THE DROPDOWNS
  // ---------------------------------------------------------------------------
  const $province = $("#province");
  const $city = $("#city");
  const $barangay = $("#barangay");

  // If this page acts as a "Checkout" (has these fields), run the script.
  if ($province.length === 0) return;

  // ---------------------------------------------------------------------------
  // STEP 2: CACHING (The "Memory")
  // ---------------------------------------------------------------------------
  // We don't want to download the list of 81 provinces every single time.
  const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 Days

  function loadFromLocal(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Check Expiry
      if (Date.now() - parsed.ts > CACHE_TTL_MS) {
        localStorage.removeItem(key);
        return null;
      }
      return parsed.data;
    } catch (e) {
      return null;
    }
  }

  function saveToLocal(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
    } catch (e) {}
  }

  // Memory (RAM) Cache for this session
  const cache = {
    provinces: null,
    municipalities: null,
    cities: null,
    barangays: null,
  };

  // ---------------------------------------------------------------------------
  // STEP 3: LOADING DATA (The "Fetch")
  // ---------------------------------------------------------------------------

  // Helper: Visual feedback "Loading..."
  function setLoading($select, loading) {
    if (loading) {
      $select
        .prop("disabled", true)
        .empty()
        .append(new Option("Loading...", ""));
    } else {
      $select.prop("disabled", false);
    }
  }

  // --- LOAD PROVINCES ---
  function loadProvinces() {
    // 1. Check RAM
    if (cache.provinces) {
      populateProvinces(cache.provinces);
      return $.Deferred().resolve(cache.provinces);
    }

    // 2. Check Disk
    const local = loadFromLocal("psgc_provinces");
    if (local) {
      cache.provinces = local;
      populateProvinces(local);
      return $.Deferred().resolve(local);
    }

    // 3. Fetch from Internet
    setLoading($province, true);
    return $.getJSON("https://psgc.gitlab.io/api/provinces.json")
      .then((data) => {
        data.sort((a, b) => a.name.localeCompare(b.name)); // A-Z Sort
        cache.provinces = data;
        saveToLocal("psgc_provinces", data);
        populateProvinces(data);
      })
      .always(() => setLoading($province, false));
  }

  function populateProvinces(list) {
    $province.empty().append(new Option("Choose...", ""));
    list.forEach((p) => $province.append(new Option(p.name, p.code)));
  }

  // --- LOAD CITIES & MUNICIPALITIES ---
  // Note: PSGC separates "Cities" (Makati) and "Municipalities" (Pateros). We need both.

  function loadMunicipalities() {
    if (cache.municipalities) return $.Deferred().resolve(cache.municipalities);
    const local = loadFromLocal("psgc_municipalities");
    if (local) {
      cache.municipalities = local;
      return $.Deferred().resolve(local);
    }
    return $.getJSON("https://psgc.gitlab.io/api/municipalities.json").then(
      (d) => {
        saveToLocal("psgc_municipalities", d);
        cache.municipalities = d;
        return d;
      },
    );
  }

  function loadCities() {
    if (cache.cities) return $.Deferred().resolve(cache.cities);
    const local = loadFromLocal("psgc_cities");
    if (local) {
      cache.cities = local;
      return $.Deferred().resolve(local);
    }
    return $.getJSON("https://psgc.gitlab.io/api/cities.json").then((d) => {
      saveToLocal("psgc_cities", d);
      cache.cities = d;
      return d;
    });
  }

  // --- LOAD BARANGAYS ---
  function loadBarangays() {
    if (cache.barangays) return $.Deferred().resolve(cache.barangays);
    const local = loadFromLocal("psgc_barangays");
    if (local) {
      cache.barangays = local;
      return $.Deferred().resolve(local);
    }
    return $.getJSON("https://psgc.gitlab.io/api/barangays.json").then((d) => {
      saveToLocal("psgc_barangays", d);
      cache.barangays = d;
      return d;
    });
  }

  // ---------------------------------------------------------------------------
  // STEP 4: THE CASCADE (The Logic)
  // ---------------------------------------------------------------------------

  // EVENT: User picked a Province
  $province.on("change", function () {
    const provinceCode = $(this).val();

    // Reset Child Dropdowns
    $city.empty().append(new Option("Choose...", "")).prop("disabled", true);
    $barangay
      .empty()
      .append(new Option("Choose...", ""))
      .prop("disabled", true);

    if (!provinceCode) return;

    setLoading($city, true);

    // Fetch both Cities and Municipalities, then combine them
    $.when(loadMunicipalities(), loadCities()).then((munList, cityList) => {
      // Unwrap jQuery promise arrays
      const muns = (Array.isArray(munList) ? munList : munList[0]) || [];
      const cits = (Array.isArray(cityList) ? cityList : cityList[0]) || [];

      // Filter by selected Province
      const available = muns
        .filter((m) => m.provinceCode === provinceCode)
        .concat(cits.filter((c) => c.provinceCode === provinceCode))
        .sort((a, b) => a.name.localeCompare(b.name));

      $city.empty().append(new Option("Choose...", ""));
      if (!available.length) $city.append(new Option("N/A", ""));
      else
        available.forEach((it) => $city.append(new Option(it.name, it.code)));

      $city.prop("disabled", false);
      setLoading($city, false);
    });
  });

  // EVENT: User picked a City
  $city.on("change", function () {
    const cityCode = $(this).val();
    $barangay
      .empty()
      .append(new Option("Choose...", ""))
      .prop("disabled", true);

    if (!cityCode) return;

    setLoading($barangay, true);

    loadBarangays().then((list) => {
      // Filter by City or Municipality Code
      const matches = (list || [])
        .filter(
          (b) => b.municipalityCode === cityCode || b.cityCode === cityCode,
        )
        .sort((a, b) => a.name.localeCompare(b.name));

      $barangay.empty().append(new Option("Choose...", ""));
      if (!matches.length) $barangay.append(new Option("N/A", ""));
      else matches.forEach((b) => $barangay.append(new Option(b.name, b.code)));

      $barangay.prop("disabled", false);
      setLoading($barangay, false);
    });
  });

  // ---------------------------------------------------------------------------
  // STEP 5: INITIALIZE
  // ---------------------------------------------------------------------------
  $(function () {
    loadProvinces(); // Kickstart the process by loading provinces
  });
})(jQuery);
