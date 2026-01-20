/**
 * =============================================================================
 * File: js/countryState.js
 * Purpose: Handle dynamic address selectors for Philippines (Province/City/Barangay).
 * =============================================================================
 *
 * This module manages the cascading dropdowns for address selection using the
 * Philippine Standard Geographic Code (PSGC) API.
 *
 * Features:
 *   - Cascading logic: Province selection triggers Municipality/City load, which triggers Barangay load.
 *   - Caching: Responses are cached in localStorage for 30 days to minimize API calls.
 *   - Sorts all lists alphabetically by name.
 *   - Handles loading states and error fallback.
 *
 * Target Elements:
 *   - #province: <select> for provinces
 *   - #city: <select> for cities/municipalities
 *   - #barangay: <select> for barangays
 *
 * API Used:
 *   - https://psgc.gitlab.io/api/
 *
 * LocalStorage Keys:
 *   - psgc_provinces, psgc_municipalities, psgc_cities, psgc_barangays
 * =============================================================================
 */

(function ($) {
  /* global jQuery */
  "use strict";

  // ---------------------------------------------------------------------------
  // 1. SELECTORS & INITIALIZATION
  // ---------------------------------------------------------------------------

  const $province = $("#province");
  const $city = $("#city");
  const $barangay = $("#barangay");

  // Exit if province selector doesn't exist on page
  if ($province.length === 0) return;

  // ---------------------------------------------------------------------------
  // 2. UI UTILITIES
  // ---------------------------------------------------------------------------

  /**
   * Clear options from a select element and set default text.
   * @param {jQuery} $select - The select element
   * @param {string} txt - Default text (e.g., "Choose...")
   */
  function clear($select, txt) {
    $select.empty();
    $select.append(
      $("<option>")
        .attr("value", "")
        .text(txt || "Choose..."),
    );
  }

  /**
   * Set loading state for a select element.
   * @param {jQuery} $select - The select element
   * @param {boolean} loading - True to disable and show loading text
   */
  function setLoading($select, loading) {
    if (loading) {
      $select.prop("disabled", true);
      clear($select, "Loading...");
    } else {
      $select.prop("disabled", false);
    }
  }

  // ---------------------------------------------------------------------------
  // 3. CACHING UTILITIES
  // ---------------------------------------------------------------------------

  const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

  /**
   * Load data from localStorage if valid and fresh.
   * @param {string} key - Storage key
   * @returns {Array|null} Parsed data or null
   */
  function loadFromLocal(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.ts || !parsed.data) return null;
      // Check freshness
      if (Date.now() - parsed.ts > CACHE_TTL_MS) {
        localStorage.removeItem(key);
        return null;
      }
      return parsed.data;
    } catch (e) {
      console.warn("local load err", key, e);
      return null;
    }
  }

  /**
   * Save data to localStorage with timestamp.
   * @param {string} key - Storage key
   * @param {Array} data - Data to save
   */
  function saveToLocal(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
    } catch (e) {
      console.warn("local save err", e);
    }
  }

  // In-memory cache for current session
  const cache = {
    provinces: null,
    municipalities: null,
    cities: null,
    barangays: null,
  };

  // ---------------------------------------------------------------------------
  // 4. DATA FETCHING (PROVINCES)
  // ---------------------------------------------------------------------------

  function loadProvinces() {
    if (cache.provinces) {
      populateProvinces(cache.provinces);
      return $.Deferred().resolve(cache.provinces).promise();
    }
    const local = loadFromLocal("psgc_provinces");
    if (local) {
      cache.provinces = local;
      populateProvinces(local);
      return $.Deferred().resolve(local).promise();
    }
    setLoading($province, true);
    return $.getJSON("https://psgc.gitlab.io/api/provinces.json")
      .then(function (data) {
        data.sort((a, b) => a.name.localeCompare(b.name));
        cache.provinces = data;
        saveToLocal("psgc_provinces", data);
        populateProvinces(data);
        return data;
      })
      .fail(function (err) {
        console.error("Failed provinces", err);
        clear($province, "Failed to load");
        return [];
      })
      .always(function () {
        setLoading($province, false);
      });
  }

  function populateProvinces(list) {
    clear($province);
    list.forEach((p) =>
      $province.append($("<option>").val(p.code).text(p.name)),
    );
  }

  // ---------------------------------------------------------------------------
  // 5. DATA FETCHING (CITIES & MUNIS)
  // ---------------------------------------------------------------------------

  function loadMunicipalities() {
    if (cache.municipalities)
      return $.Deferred().resolve(cache.municipalities).promise();
    const local = loadFromLocal("psgc_municipalities");
    if (local) {
      cache.municipalities = local;
      return $.Deferred().resolve(local).promise();
    }
    return $.getJSON("https://psgc.gitlab.io/api/municipalities.json")
      .then(function (data) {
        cache.municipalities = data;
        saveToLocal("psgc_municipalities", data);
        return data;
      })
      .catch(function (err) {
        console.error("Failed municipalities", err);
        cache.municipalities = [];
        return [];
      });
  }

  function loadCities() {
    if (cache.cities) return $.Deferred().resolve(cache.cities).promise();
    const local = loadFromLocal("psgc_cities");
    if (local) {
      cache.cities = local;
      return $.Deferred().resolve(local).promise();
    }
    return $.getJSON("https://psgc.gitlab.io/api/cities.json")
      .then(function (data) {
        cache.cities = data;
        saveToLocal("psgc_cities", data);
        return data;
      })
      .catch(function (err) {
        console.error("Failed cities", err);
        cache.cities = [];
        return [];
      });
  }

  // ---------------------------------------------------------------------------
  // 6. DATA FETCHING (BARANGAYS)
  // ---------------------------------------------------------------------------

  function loadBarangays() {
    if (cache.barangays) return $.Deferred().resolve(cache.barangays).promise();
    const local = loadFromLocal("psgc_barangays");
    if (local) {
      cache.barangays = local;
      return $.Deferred().resolve(local).promise();
    }
    return $.getJSON("https://psgc.gitlab.io/api/barangays.json")
      .then(function (data) {
        cache.barangays = data;
        saveToLocal("psgc_barangays", data);
        return data;
      })
      .catch(function (err) {
        console.error("Failed barangays", err);
        cache.barangays = [];
        return [];
      });
  }

  // ---------------------------------------------------------------------------
  // 7. EVENT HANDLERS
  // ---------------------------------------------------------------------------

  // Handle Province Change -> Load Cities/Municipalities
  $province.on("change", function () {
    const provinceCode = $(this).val();
    clear($city);
    clear($barangay);
    $city.prop("disabled", true);
    $barangay.prop("disabled", true);

    if (!provinceCode) return;

    setLoading($city, true);

    $.when(loadMunicipalities(), loadCities()).then(
      function (munList, cityList) {
        // jQuery unwraps promises; actual arrays are first arg if multiple args returned
        munList = Array.isArray(munList[0]) ? munList[0] : munList;
        cityList = Array.isArray(cityList[0]) ? cityList[0] : cityList;

        const munMatches = (munList || []).filter(
          (m) => m.provinceCode === provinceCode,
        );
        const cityMatches = (cityList || []).filter(
          (c) => c.provinceCode === provinceCode,
        );

        // Combine and sort
        const matches = munMatches
          .concat(cityMatches)
          .sort((a, b) => a.name.localeCompare(b.name));

        if (!matches.length) {
          clear($city, "N/A");
          setLoading($city, false);
          return;
        }

        matches.forEach((it) =>
          $city.append($("<option>").val(it.code).text(it.name)),
        );
        $city.prop("disabled", false);
        setLoading($city, false);
      },
    );
  });

  // Handle City Change -> Load Barangays
  $city.on("change", function () {
    const placeCode = $(this).val();
    clear($barangay);
    $barangay.prop("disabled", true);

    if (!placeCode) return;

    setLoading($barangay, true);
    loadBarangays().then(function (list) {
      const matches = (list || [])
        .filter(
          (b) => b.municipalityCode === placeCode || b.cityCode === placeCode,
        )
        .sort((a, b) => a.name.localeCompare(b.name));

      if (!matches.length) {
        clear($barangay, "N/A");
        setLoading($barangay, false);
        return;
      }
      matches.forEach((b) =>
        $barangay.append($("<option>").val(b.code).text(b.name)),
      );
      $barangay.prop("disabled", false);
      setLoading($barangay, false);
    });
  });

  // ---------------------------------------------------------------------------
  // 8. INITIALIZE
  // ---------------------------------------------------------------------------

  clear($city);
  clear($barangay);
  setLoading($city, false);
  setLoading($barangay, false);

  $(function () {
    loadProvinces();
  });
})(jQuery);
