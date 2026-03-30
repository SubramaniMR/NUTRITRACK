(function () {
 
  /*State*/
  let scannedProduct = null;   // raw data from /lookup-barcode
  let selectedMeal   = 'breakfast';
 
  /* Open / Close */
  window.openBarcodeScanner = function () {
    _showView('scan');
    document.getElementById('barcodeModal').classList.add('open');
    document.getElementById('barcodeBackdrop').classList.add('open');
    document.getElementById('scanError').textContent = '';
    _startQuagga();
  };
 
  window.closeBarcodeScanner = function () {
    _stopQuagga();
    document.getElementById('barcodeModal').classList.remove('open');
    document.getElementById('barcodeBackdrop').classList.remove('open');
    scannedProduct = null;
  };
 
  window.retryBarcodeScan = function () {
    scannedProduct = null;
    _showView('scan');
    document.getElementById('scanError').textContent = '';
    _startQuagga();
  };
 
  /* Quagga */
  function _startQuagga () {
    if (typeof Quagga === 'undefined') {
      document.getElementById('scanError').textContent =
        'Scanner library not loaded. Check your internet connection.';
      return;
    }
 
    Quagga.init({
      inputStream: {
        type       : 'LiveStream',
        target     : document.getElementById('scannerContainer'),
        constraints: {
          facingMode : 'environment',   // rear camera on mobile
          width      : { ideal: 1280 },
          height     : { ideal: 720  }
        },
        willReadFrequently: true,

      },
      locator   : { patchSize: 'small', halfSample: true },
      numOfWorkers : navigator.hardwareConcurrency > 2 ? 2 : 1,
      frequency : 10,
      decoder   : {
        readers: ['ean_reader', 'upc_reader', 'ean_8_reader']
      },
      locate: true
    }, function (err) {
      if (err) {
        console.error('Quagga init error:', err);
        var msg = 'Could not access camera.';
        if (err.name === 'NotAllowedError')  msg = 'Camera permission denied. Please allow camera access and try again.';
        if (err.name === 'NotFoundError')    msg = 'No camera found on this device.';
        if (err.name === 'NotSupportedError')msg = 'Camera not supported. Make sure you\'re on HTTPS.';
        document.getElementById('scanError').textContent = msg;
        return;
      }
      Quagga.start();
    });
 
    /* Debounce: only fire once per scan session */
    var detected = false;
    Quagga.onDetected(function (result) {
      if (detected) return;
      var code = result && result.codeResult && result.codeResult.code;
      if (!code) return;
      detected = true;
 
      _stopQuagga();
      _lookupBarcode(code);
    });
  }
 
  function _stopQuagga () {
    try { Quagga.offDetected(); Quagga.stop(); } catch (e) { /* already stopped */ }
  }
 
  /* Open food facts lookup - direct from browser, no api and cors enabled */
   async function _lookupBarcode (barcode) {
    document.getElementById('scanError').textContent = 'Looking up product…';
 
    try {
      var url = 'https://world.openfoodfacts.org/api/v0/product/' + encodeURIComponent(barcode) + '.json';
      var res = await fetch(url);
 
      if (!res.ok) throw new Error('OFF returned ' + res.status);
 
      var data = await res.json();
 
      if (data.status !== 1 || !data.product) {
        _showView('notfound');
        return;
      }
 
      var p  = data.product;
      var n  = p.nutriments || {};
 
      /* Resolve kcal — OFF has multiple possible keys */
      var kcal = n['energy-kcal_100g']
              || n['energy-kcal']
              || (n['energy_100g'] ? Math.round(n['energy_100g'] / 4.184) : 0);
 
      scannedProduct = {
        found             : true,
        name              : p.product_name || p.product_name_en || 'Unknown product',
        image             : p.image_front_url || p.image_url || '',
        calories_per_100g : Math.round(parseFloat(kcal)                          || 0),
        protein_per_100g  : Math.round((parseFloat(n['proteins_100g'])      || 0) * 10) / 10,
        carbs_per_100g    : Math.round((parseFloat(n['carbohydrates_100g']) || 0) * 10) / 10,
        fat_per_100g      : Math.round((parseFloat(n['fat_100g'])           || 0) * 10) / 10,
        serving_size      : p.serving_size || '100g'
      };
 
      _renderResultCard(scannedProduct);
      _showView('result');
 
    } catch (e) {
      console.error('Barcode lookup failed:', e);
      document.getElementById('scanError').textContent =
        'Lookup failed. Check your connection and try again.';
      _showView('scan');
    }
  }
 
  /* Render result card*/
  function _renderResultCard (product) {
    var imgHtml = product.image
      ? '<img src="' + _esc(product.image) + '" class="barcode-result-img" alt="product image">'
      : '<div class="barcode-result-img-placeholder">🛒</div>';
 
    var card = document.getElementById('barcodeResultCard');
    card.innerHTML =
      imgHtml +
      '<div class="barcode-result-info">' +
        '<div class="barcode-result-name">' + _esc(product.name || 'Unknown product') + '</div>' +
        '<div class="barcode-result-macros">' +
          '<span class="macro-chip kcal">' + Math.round(product.calories_per_100g || 0) + ' kcal</span>' +
          '<span class="macro-chip">P ' + _fmt(product.protein_per_100g)  + 'g</span>' +
          '<span class="macro-chip">C ' + _fmt(product.carbs_per_100g)    + 'g</span>' +
          '<span class="macro-chip">F ' + _fmt(product.fat_per_100g)      + 'g</span>' +
        '</div>' +
      '</div>';
 
    /* Update serving note */
    document.getElementById('servingNote').textContent =
      'per 100g · product: ' + (product.serving_size || '—');
 
    /* Re-init meal type buttons for barcode modal */
    _initBarcodesMealButtons();
  }
 
  /* Meal type buttons (inside barcode modal) */
  function _initBarcodesMealButtons () {
    var btns = document.querySelectorAll('#barcodeResultView .meal-type-btn');
    btns.forEach(function (btn) {
      btn.classList.remove('active');
      if (btn.dataset.meal === selectedMeal) btn.classList.add('active');
      btn.onclick = function () {
        btns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        selectedMeal = btn.dataset.meal;
      };
    });
  }
 
  /* Log the scanned food */
  window.logScannedFood = async function () {
    if (!scannedProduct) return;
 
    var grams = parseFloat(document.getElementById('servingSize').value) || 100;
    var ratio  = grams / 100;
 
    var payload = {
      food_name : scannedProduct.name || 'Scanned product',
      calories  : Math.round((scannedProduct.calories_per_100g || 0) * ratio),
      protein   : _round((scannedProduct.protein_per_100g  || 0) * ratio),
      carbs     : _round((scannedProduct.carbs_per_100g    || 0) * ratio),
      fat       : _round((scannedProduct.fat_per_100g      || 0) * ratio),
      meal_type : selectedMeal,
      image     : scannedProduct.image || null
    };
 
    var btn = document.getElementById('barcodeLogBtn');
    btn.textContent = 'Logging…';
    btn.disabled = true;
 
    try {
      /* postFoodLog resused */
      await postFoodLog(payload);
      closeBarcodeScanner();
    } catch (e) {
      btn.textContent = 'Log food';
      btn.disabled = false;
      alert('Could not log food. Please try again.');
    }
  };
 
  /* View switcher */
  function _showView (view) {
    document.getElementById('barcodeScanView').style.display    = view === 'scan'     ? 'block' : 'none';
    document.getElementById('barcodeResultView').style.display  = view === 'result'   ? 'block' : 'none';
    document.getElementById('barcodeNotFoundView').style.display= view === 'notfound' ? 'block' : 'none';
  }
 
  /* Helpers */
  function _esc (str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function _fmt (n) { return n != null ? Math.round(n * 10) / 10 : '–'; }
  function _round (n) { return Math.round(n * 10) / 10; }
 
})();