
//#region  📌 GLOBAL UNIT TOTAL FUNCTION//
window.calculateDynamicInvoiceTotal = function() {
    // 1. Get references to all elements
    const Eunitprice = document.getElementById('edit-unit-price');
    const Eqty = document.getElementById('edit-qty');
    const Ediscper = document.getElementById('edit-discount');
    const Evatper = document.getElementById('edit-vat');
    const Etaxable = document.getElementById('edit-taxable');
    const Eunitvat = document.getElementById('edit-vat-total');
    const Eunittotal = document.getElementById('edit-unit-total');

    const Eicost = document.getElementById('edit-icost');
    const Ediscamt = document.getElementById('edit-disc-amt');
    const Eucost = document.getElementById('edit-ucost');
    const Eumargin = document.getElementById('edit-umargin');
    const Esvalue = document.getElementById('edit-unit-svalue');
    const Etcost = document.getElementById('edit-tcost');
    const Etmargin = document.getElementById('edit-tmargin');
    const Eostock = document.getElementById('edit-o-stock');
    const Eastock = document.getElementById('edit-a-stock');

    // 2. SAFETY CHECK: If this page doesn't have the invoice elements, exit safely
    if (!Eunitprice || !Eqty || !Ediscper || !Evatper) {
        return; 
    }

    // 3. Convert text values to numbers (fallback safely if fields are empty)
    const invUprice = parseFloat(Eunitprice.value) || 0;     
    const invUquantity = parseFloat(Eqty.value) || 0;        
    const invUdiscountPct = parseFloat(Ediscper.value) || 0; 
    const invUvatPct = parseFloat(Evatper.value) || 0;       
    const invItemcost = parseFloat(Eicost.value) || 0;   
    const invStock = parseFloat(Eostock.value) || 0;   

    // 4. Calculations
    const invUdiscountFactor = 1 - (invUdiscountPct / 100);
    const invUnetPrice = invUprice * invUdiscountFactor; 
    const invUdiscAmount = invUprice * invUdiscountPct / 100;
    const invUcost = invItemcost * invUquantity;
    const Utotalinv = invUnetPrice * invUquantity;   
    const invUmargin = Utotalinv - invUcost;        
    const invAstock = invStock - invUquantity;
    const invSvalue = invItemcost * invAstock;

    const vatUFactor = 1 + (invUvatPct / 100); 
    const Uinvtotal = Utotalinv * vatUFactor; 
    const Uvat = Utotalinv * invUvatPct / 100; 

    // 5. Output results
    if(Etaxable) Etaxable.value = Utotalinv.toFixed(2);
    if(Eunitvat) Eunitvat.value = Uvat.toFixed(2);
    if(Eunittotal) Eunittotal.value = Uinvtotal.toFixed(2);
    if(Ediscamt) Ediscamt.value = invUdiscAmount.toFixed(2);
    if(Eucost) Eucost.value = invUcost.toFixed(2);
    if(Eumargin) Eumargin.value = invUmargin.toFixed(2);

    if (Esvalue) {
        Esvalue.value = invSvalue <= 0 ? "0.00" : invSvalue.toFixed(2);
    }
    if (Eastock) {
        Eastock.value = invAstock <= 0 ? "0" : invAstock;
    }
};

// 6. Automatically bind the inputs when the page loads (if they exist)
document.addEventListener('DOMContentLoaded', () => {
    const Eunitprice = document.getElementById('edit-unit-price');
    const Eqty = document.getElementById('edit-qty');
    const Ediscper = document.getElementById('edit-discount');
    const Evatper = document.getElementById('edit-vat');

    if (Eunitprice && Eqty && Ediscper && Evatper) {
        // FIXED: Removed the extra () from window.calculateDynamicInvoiceTotal() so it calls on input, not immediately
        Eunitprice.addEventListener('input', window.calculateDynamicInvoiceTotal);
        Eqty.addEventListener('input', window.calculateDynamicInvoiceTotal);
        Ediscper.addEventListener('input', window.calculateDynamicInvoiceTotal);
        Evatper.addEventListener('input', window.calculateDynamicInvoiceTotal);
    }
});
//#endregion

//#region  📌 GLOBAL FORMAT DATE TO DISPLAY DD-MMM-YYYY
            function formatToDdMMMyyyy(dateString) {
              // 1. Return empty string if date is null, undefined, empty, or literal "null" string
              if (!dateString || String(dateString).trim() === "" || dateString === "null") {
                return "";
              }
              
              const dateObj = new Date(dateString);
              
              // 2. Return empty string if the date is invalid OR defaults to 1970 (Unix Epoch)
              if (isNaN(dateObj.getTime()) || dateObj.getFullYear() === 1970) {
                return "";
              }
              
              // 3. Format valid dates
              const day = String(dateObj.getDate()).padStart(2, "0");
              const yy = String(dateObj.getFullYear()).slice(-2);
              const months = [
                "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"
              ];
              
              return day + "-" + months[dateObj.getMonth()] + "-" + yy;
            }

              // function formatToDdMMMyyyy(dateString) {
              //   if (!dateString) return "N/A";
              //   const dateObj = new Date(dateString);
              //   if (isNaN(dateObj.getTime())) return "N/A";
              //   const day = String(dateObj.getDate()).padStart(2, "0");
              //   const yy = String(dateObj.getFullYear()).slice(-2);
              //   const months = [
              //     "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",
              //   ];
              //   return (
              //     day + "-" + months[dateObj.getMonth()] + "-" + yy
              //   );
              // }
//#endregion ============ END FORMAT DATE TO DISPLAY DD-MMM-YYYY===================================//

//#region  📌 GLOBAL AMOUNT TO WORDS CONFIGURATION//
const toWordsConfig = new ToWords({
    localeCode: "en-AE", // Using English locale as base
    converterOptions: {
      currency: true,
      ignoreDecimal: false,
      ignoreZeroCurrency: false,
      doNotAddOnly: false,
      currencyOptions: {
        name: "Dirham",
        plural: "Dirhams",
        symbol: "AED", // or the new symbol
        fractionalUnit: {
          name: "Fils",
          plural: "Fils",
          symbol: "",
        },
      },
    },
  });  
//#endregion  📌 INVOICE GRAND TOTAL TO WORDS CONFIGURATION//

//#region  📌 DOM CONTENT LOADED EVENT ===========//
document.addEventListener('DOMContentLoaded', () => {
//#region ==== CENTRALIZED PRODUCT CODE SEARCH ENGINE ====
    async function handleCodeSearch(value, activeModal, resultsList) {
    // DOM element references for product search and form fields//
                const searchProduct = activeModal.querySelector('.global-products');
                const searchProductCode = activeModal.querySelector('.global-item-code');
                //const productResultsList = activeModal.querySelector('.global-product-autocomplete-results');
               // const productCodeResultsList = activeModal.querySelector('.global-item-code-autocomplete-results');
                const IunitInput = activeModal.querySelector('.global-i-unit');
                const IsizeInput = activeModal.querySelector('.global-i-size');
                const IRALInput = activeModal.querySelector('.global-i-ral');
                const priceInput = activeModal.querySelector('.global-unit-price');
                const pidInput = activeModal.querySelector('.global-pid');
                const costInput = activeModal.querySelector('.global-i-cost');
                const astockInput = activeModal.querySelector('.global-a-stock');
                const ostockInput = activeModal.querySelector('.global-o-stock');  

    const response = await fetch(`/api/products/search?q=${encodeURIComponent(value)}`);
    const products = await response.json();

    resultsList.innerHTML = "";

    if (products.length === 0) {
        resultsList.classList.add("d-none");
        return;
    }

    products.forEach(product => {
        const li = document.createElement("li");
        li.className = "list-group-item list-group-item-action cursor-pointer py-1 px-1 fs-7";
        li.style.cursor = "pointer";
        li.style.color = "white";
        li.style.backgroundColor = "#1e0136"; // Different background to visually distinguish products
        li.textContent = product.pid;

        li.addEventListener("click", () => {
            if (searchProduct) searchProduct.value = product.item.toUpperCase();
            if (searchProductCode) searchProductCode.value = product.pid;
            if (IunitInput) IunitInput.value = product.Iunit;
            if (IsizeInput) IsizeInput.value = product.Isize;
            if (IRALInput) IRALInput.value = product.IRAL;
            const priceValue = Number(product.price) || 0;
            if (priceInput) priceInput.value = priceValue.toFixed(2);
            if (pidInput) pidInput.value = product.ID !== undefined && product.ID !== null && String(product.ID).trim() !== '' ? product.ID : (product._id || '');
            const itemcost = Number(product.cost) || 0;
            if (costInput) costInput.value = itemcost.toFixed(2);

            if (astockInput) {
            // 1. Assign the stock value (fallback to '0' if null/undefined)
            const stockValue = product.stock || '0';
            astockInput.value = stockValue;
              // 2. Convert to a number to make an accurate math comparison
              if (parseFloat(stockValue) > 0) {
                  astockInput.style.backgroundColor = '#018b22'; // Light green (pleasant for inputs)
                  astockInput.style.color = '#ffffff';           // Dark green text
              } else {
                  astockInput.style.backgroundColor = '#a30010'; // Light red/pink
                  astockInput.style.color = '#ffffff';           // Dark red text
              }
          }
            // if (astockInput) astockInput.value = product.stock || '0';
            if (ostockInput) ostockInput.value = product.stock || '0';
  
            resultsList.classList.add("d-none");
            if (activeModal.id === 'newco-modal-overlay') window.calculateDynamicCOTotal?.();
            else if (activeModal.id === 'editco-modal-overlay') window.calculateDynamicEditCOTotal?.();
            else if (activeModal.id === 'co-newinvo-modal-overlay') window.calculateCOInvoiceTotal?.();
            else if (activeModal.id === 'quote-newinvo-modal-overlay') window.calculateQuoteInvoiceTotal?.();
            else if (activeModal.id === 'editquot-modal-overlay') window.calculateDynamicEditQuotationTotal?.();
            else window.calculateDynamicInvoiceTotal(); 
        });
        resultsList.appendChild(li);
    });
    resultsList.classList.remove("d-none");
}
//#endregion ==============================

//#region ==== CENTRALIZED PRODUCT SEARCH ENGINE ====
    async function handleProductSearch(value, activeModal, resultsList) {
    // DOM element references for product search and form fields//
                const searchProduct = activeModal.querySelector('.global-products');
                const searchProductCode = activeModal.querySelector('.global-item-code');
                //const productResultsList = activeModal.querySelector('.global-product-autocomplete-results');
                //const productCodeResultsList = activeModal.querySelector('.global-item-code-autocomplete-results');
                const IunitInput = activeModal.querySelector('.global-i-unit');
                const IsizeInput = activeModal.querySelector('.global-i-size');
                const IRALInput = activeModal.querySelector('.global-i-ral');
                const priceInput = activeModal.querySelector('.global-unit-price');
                const pidInput = activeModal.querySelector('.global-pid');
                const costInput = activeModal.querySelector('.global-i-cost');
                const astockInput = activeModal.querySelector('.global-a-stock');
                const ostockInput = activeModal.querySelector('.global-o-stock');  

    const response = await fetch(`/api/products/search?q=${encodeURIComponent(value)}`);
    const products = await response.json();

    resultsList.innerHTML = "";

    if (products.length === 0) {
        resultsList.classList.add("d-none");
        return;
    }

    products.forEach(product => {
        const li = document.createElement("li");
        li.className = "list-group-item list-group-item-action cursor-pointer py-1 px-1 fs-7";
        li.style.cursor = "pointer";
        li.style.color = "white";
        li.style.backgroundColor = "#1e0136"; // Different background to visually distinguish products
        li.textContent = product.item;

        li.addEventListener("click", () => {
            if (searchProduct) searchProduct.value = product.item.toUpperCase();
            if (searchProductCode) searchProductCode.value = product.pid;
            if (IunitInput) IunitInput.value = product.Iunit;
            if (IsizeInput) IsizeInput.value = product.Isize;
            if (IRALInput) IRALInput.value = product.IRAL;
            const priceValue = Number(product.price) || 0;
            if (priceInput) priceInput.value = priceValue.toFixed(2);
            if (pidInput) pidInput.value = product.ID !== undefined && product.ID !== null && String(product.ID).trim() !== '' ? product.ID : (product._id || '');
            const itemcost = Number(product.cost) || 0;
            if (costInput) costInput.value = itemcost.toFixed(2);

                        if (astockInput) {
            // 1. Assign the stock value (fallback to '0' if null/undefined)
            const stockValue = product.stock || '0';
            astockInput.value = stockValue;
              // 2. Convert to a number to make an accurate math comparison
              if (parseFloat(stockValue) > 0) {
                  astockInput.style.backgroundColor = '#018b22'; // Light green (pleasant for inputs)
                  astockInput.style.color = '#ffffff';           // Dark green text
              } else {
                  astockInput.style.backgroundColor = '#a30010'; // Light red/pink
                  astockInput.style.color = '#ffffff';           // Dark red text
              }
          }
            // if (astockInput) astockInput.value = product.stock || '0';
            if (ostockInput) ostockInput.value = product.stock || '0';
  
            resultsList.classList.add("d-none");
            if (activeModal.id === 'newco-modal-overlay') window.calculateDynamicCOTotal?.();
            else if (activeModal.id === 'editco-modal-overlay') window.calculateDynamicEditCOTotal?.();
            else if (activeModal.id === 'co-newinvo-modal-overlay') window.calculateCOInvoiceTotal?.();
            else if (activeModal.id === 'quote-newinvo-modal-overlay') window.calculateQuoteInvoiceTotal?.();
            else if (activeModal.id === 'editquot-modal-overlay') window.calculateDynamicEditQuotationTotal?.();
            else window.calculateDynamicInvoiceTotal(); 
        });
        resultsList.appendChild(li);
    });
    resultsList.classList.remove("d-none");
}
//#endregion ==== CENTRALIZED PRODUCT SEARCH END ====

//#region === CENTRALIZED CUSTOMER SEARCH ENGINE =====
async function handleCustomerSearch(value, activeModal, resultsList) {
    // Find all input references bound strictly to this specific active modal layout
    const searchCustomer = activeModal.querySelector('.global-customer');
    const postboxInput = activeModal.querySelector('.global-postbox');
    const emiratesInput = activeModal.querySelector('.global-emirate');
    const addressInput = activeModal.querySelector('.global-address');
    const vatidInput = activeModal.querySelector('.global-vat-no');
    const contactInput = activeModal.querySelector('.global-contact-person');
    const phoneInput = activeModal.querySelector('.global-contact-number');
    const paymenttermInput = activeModal.querySelector('.global-payment-terms');

    const response = await fetch(`/api/customers/search?q=${encodeURIComponent(value)}`);
    const customers = await response.json();
    
    resultsList.innerHTML = ""; // Wipe historical query traces cleanly
    
    if (customers.length === 0) {
        resultsList.classList.add("d-none");
        return;
    }

    customers.forEach(customer => {
        // FIX: Always use global document object to generate elements
        const li = document.createElement("li");
        li.className = "list-group-item list-group-item-action cursor-pointer py-1 px-1 fs-7";
        li.style.cursor = "pointer";
        li.style.color = "white";
        li.style.backgroundColor = "#3d0258";
        li.textContent = customer.name;

        // Map backend payload context cleanly into targeted text inputs
        li.addEventListener("click", () => {
            if (searchCustomer) searchCustomer.value = customer.name.toUpperCase();
            if (postboxInput) postboxInput.value = (customer.postbox || '-').toUpperCase();
            if (emiratesInput) emiratesInput.value = (customer.emirates || 'ABU DHABI').toUpperCase();
            if (addressInput) addressInput.value = (customer.address || customer.emirates || '').toUpperCase();
            if (vatidInput) vatidInput.value = customer.vatid || '-';
            if (contactInput) contactInput.value = (customer.contact || '-').toUpperCase();
            if (phoneInput) phoneInput.value = customer.phone || '-';
            if (paymenttermInput) paymenttermInput.value = customer.paymentterm || "IMMEDIATE";
            
            resultsList.classList.add("d-none"); 
        });

        resultsList.appendChild(li);
    });

    resultsList.classList.remove("d-none");
}

//#endregion === CENTRALIZED CUSTOMER SEARCH END =====

//#region === CLOSE AUTOCOMPLETE =====
// Tap outside text boxes to automatically clear visual search drop down panel list UI overlays
// Tap anywhere on the screen to safely close autocomplete lists
document.addEventListener("click", function (e) {
    // 1. Find all autocomplete results panels currently visible on the entire page
    const openLists = document.querySelectorAll(
        '.global-autocomplete-results:not(.d-none), ' +
        '.global-product-autocomplete-results:not(.d-none), ' +
        '.global-item-code-autocomplete-results:not(.d-none)'
    );

    openLists.forEach(list => {
        // 2. Find the structural modal this specific list lives inside
        const modal = list.closest('.global-modal');
        if (!modal) return;

        // 3. Find the corresponding search text inputs inside this specific modal
        const searchCustomer = modal.querySelector('.global-customer');
        const searchProduct = modal.querySelector('.global-products');
        const searchProductCode = modal.querySelector('.global-item-code');

        // 4. Check if the user clicked inside the list container or its target input box
        const clickedInsideInput = (e.target === searchCustomer || e.target === searchProduct || e.target === searchProductCode);
        const clickedInsideList = list.contains(e.target);

        // If they clicked completely outside both elements, conceal the dropdown container panel cleanly
        if (!clickedInsideInput && !clickedInsideList) {
            list.classList.add("d-none");
        }
    });
});
//#endregion ============================//

 

//#region=== ALL CONST ASSIGNMENT FOR PAGE LOAD ==============================//
  const dashBoardCard = document.getElementById('dashboard-cards');
  const invHead = document.getElementById('inv-head');
  const cnHead = document.getElementById('cn-head');
  const quoteHead = document.getElementById('quote-head');
  const doHead = document.getElementById('do-head');
  const lpoHead = document.getElementById('lpo-head');
  const coHead = document.getElementById('co-head');
  const clientHead = document.getElementById('client-head');
  const productsHead = document.getElementById('products-head');
  const purchasesHead = document.getElementById('purchases-head');
  const expensesHead = document.getElementById('expenses-head');
  //===================================================================//
 
//#endregion ================================================//

//#region=== ALL MODAL AUTOCOMPLETE ==============================//
   // 1. Centralized tracking variables inside DOM scope
    let currentActiveModal = null; 
    let searchTimeout;

    // 2. Flawless tracking tracker: Detect the active modal whenever a user clicks/tabs into it
    document.addEventListener("focusin", function(event) {
        const modalWithFocus = event.target.closest(".global-modal");
        if (modalWithFocus) {
            currentActiveModal = modalWithFocus;
        }
    });

     // 3. Centralized Event Listener for Typing (Handles Customer & Product globally)
    document.addEventListener("input", function(event) {
        const target = event.target;
        let resultsClass = '';
        // Target structural class hooks
        const isCustomer = target.classList.contains("global-customer");
        const isProduct = target.classList.contains("global-products");
        const isPCode = target.classList.contains("global-item-code");

        if (isCustomer) {
          resultsClass = '.global-autocomplete-results';
          } else if (isProduct) {
              resultsClass = '.global-product-autocomplete-results';
          } else if (isPCode) {
              resultsClass = '.global-item-code-autocomplete-results'; // Replace with your actual class name
          }

        if (isCustomer || isProduct || isPCode) {
            const value = target.value.trim();
            
            // Get references strictly from the cached focused modal context
            const activeModal = currentActiveModal || target.closest(".global-modal");
            if (!activeModal) return;

            // Select the element using the determined class
            const resultsList = resultsClass ? activeModal.querySelector(resultsClass) : null;
            // const resultsList = isCustomer ? activeModal.querySelector('.global-autocomplete-results')
            //     : activeModal.querySelector('.global-product-autocomplete-results')
                

            // If query is empty, instantly close dropdown and exit
            if (value.length < 1) {
                if (resultsList) resultsList.classList.add("d-none");
                return;
            }

            // --- DEBOUNCE LOGIC: Halts the server lag ---
            clearTimeout(searchTimeout);

            // Wait 300 milliseconds after typing stops before hitting Node server
            searchTimeout = setTimeout(async () => {
                try {
                    if (isCustomer) {
                        await handleCustomerSearch(value, activeModal, resultsList);
                    } else if (isProduct) {
                        await handleProductSearch(value, activeModal, resultsList);
                    }
                     else if (isPCode) {
                        await handleCodeSearch(value, activeModal, resultsList);
                    }
                } catch (err) {
                    console.error("Autocomplete backend failure: ", err);
                }
            }, 300);
        }
    });

// EMIRATES COMBO =====  1. Select all the combobox container elements
const comboboxes = document.querySelectorAll('.custom-combobox1');

comboboxes.forEach(combobox => {
    if(combobox.closest('#newcust-modal-overlay'))return;
    // 2. Find elements specifically INSIDE this single combobox instance
    const emirateinput = combobox.querySelector('.global-emirate');
    const emiratelist = combobox.querySelector('.dropdown-list');
    const emirateitems = combobox.querySelectorAll('li');

    // Show list on focus
    emirateinput.addEventListener('focus', () => {
        emiratelist.style.display = 'block';
    });

    // Update input value when clicking an option
    emirateitems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevents the document click listener from interfering
            emirateinput.value = item.textContent.trim();
            emiratelist.style.display = 'none';
        });
    });
    // Filter list items as user types
    emirateinput.addEventListener('input', () => {
        const filter = emirateinput.value.toLowerCase();
        emirateitems.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(filter) ? 'block' : 'none';
        });
    });
});
// 3. Global click listener to close ANY open dropdown when clicking outside
document.addEventListener('click', (e) => {
    comboboxes.forEach(combobox => {
    if(combobox.closest('#newcust-modal-overlay'))return;
        const emiratelist = combobox.querySelector('.dropdown-list');
        // If the click is outside this specific combobox, hide its list
        if (!combobox.contains(e.target)) {
            emiratelist.style.display = 'none';
        }
    });
});
//===================== EMIRATE COMBO ENDS===============================================//
// ADDRESS COMBO =====  1. Select all the combobox container elements
const comboboxes2 = document.querySelectorAll('.custom-combobox2');

comboboxes2.forEach(combobox => {
    if(combobox.closest('#newcust-modal-overlay'))return;
    // 2. Find elements specifically INSIDE this single combobox instance
    const addressinput = combobox.querySelector('.global-address');
    const addresslist = combobox.querySelector('.dropdown-list');
    const addressitems = combobox.querySelectorAll('li');

    // Show list on focus
    addressinput.addEventListener('focus', () => {
        addresslist.style.display = 'block';
    });

    // Update input value when clicking an option
    addressitems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevents the document click listener from interfering
            addressinput.value = item.textContent.trim();
            addresslist.style.display = 'none';
        });
    });

    // Filter list items as user types
    addressinput.addEventListener('input', () => {
        const filter = addressinput.value.toLowerCase();
        addressitems.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(filter) ? 'block' : 'none';
        });
    });
});
// 3. Global click listener to close ANY open dropdown when clicking outside
document.addEventListener('click', (e) => {
    comboboxes2.forEach(combobox => {
    if(combobox.closest('#newcust-modal-overlay'))return;
        const addresslist = combobox.querySelector('.dropdown-list');
        // If the click is outside this specific combobox, hide its list
        if (!combobox.contains(e.target)) {
            addresslist.style.display = 'none';
        }
    });
});
//===================== ADDRESS COMBO ENDS===============================================//
//====== PAYMENT TERMS COMBO =====  1. Select all the combobox container elements
const comboboxes3 = document.querySelectorAll('.custom-combobox3');

comboboxes3.forEach(combobox => {
    if(combobox.closest('#newcust-modal-overlay'))return;
    // 2. Find elements specifically INSIDE this single combobox instance
    const termsinput = combobox.querySelector('.global-payment-terms');
    const termslist = combobox.querySelector('.dropdown-list');
    const termsitems = combobox.querySelectorAll('li');

    // Show list on focus
    termsinput.addEventListener('focus', () => {
        termslist.style.display = 'block';
    });

    // Update input value when clicking an option
    termsitems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevents the document click listener from interfering
            termsinput.value = item.textContent.trim();
            termslist.style.display = 'none';
        });
    });

    // Filter list items as user types
    termsinput.addEventListener('input', () => {
        const filter = termsinput.value.toLowerCase();
        termsitems.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(filter) ? 'block' : 'none';
        });
    });
});

// 3. Global click listener to close ANY open dropdown when clicking outside
document.addEventListener('click', (e) => {
    comboboxes3.forEach(combobox => {
    if(combobox.closest('#newcust-modal-overlay'))return;
        const termslist = combobox.querySelector('.dropdown-list');
        // If the click is outside this specific combobox, hide its list
        if (!combobox.contains(e.target)) {
            termslist.style.display = 'none';
        }
    });
});
//===================== PAYMENT TERMS COMBO ENDS===============================================//


//#endregion ===============================================================//    

//#region=== ALL PAGES LOAD CONDITION ==============================//

if (dashBoardCard) {
  initDashboardPage();
}
if (invHead) {
  initInvoicesPage();
}
if (cnHead) {
  initCreditNotesPage();
}
if (quoteHead) {
  initQuotationsPage();
}
if (doHead) {
  initDeliveryOrderPage();
}
if (lpoHead) {
  initLPOPage();
}
if (coHead) {
  initCOPage();
}
if (clientHead) {
  initClientPage();
}
if (productsHead) {
  initProductPage();
}
if (purchasesHead) {
  initPurchasesPage();
}
if (expensesHead) {
  initExpensesPage();
}
//#endregion ===============================================//
});
//#endregion  📌 DOM CONTENT LOADED EVENT ===========//

//==========================DASHBOARD=====================================//
//#region  📌 DASHBOARD PAGE CODE ALL INSERT  HERE =====//
function initDashboardPage() {
let selectedInvoices = [];
        const chartContainer = document.getElementById('performanceChart');
        const yearSelector = document.getElementById('yearSelector');
        const rowTable = document.getElementById('transactions-table-body');
        const wrapper = document.querySelectorAll('.mouse-over');
        const PDCtitle = document.getElementById('cardYearTitle2');
        const btnPdcUpdate = document.getElementById('btn-pdc-update');

        

//#region === CURRENCY FORMATTER FUNCTION =============//
        const formatCurrency = (val) => {
            const formattedNum = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(val);
            return `<svg viewBox="0 0 24 24" style="width:14px; height:14px; fill:currentColor; margin-right:4px; vertical-align:middle; display:inline-block;"><path d="M5 3h6c4.418 0 8 3.582 8 8s-3.582 8-8 8H5V3zm2 2v12h4c3.314 0 6-2.686 6-6s-2.686-6-6-6H7zM3 9h18v1.5H3V9zm0 3.5h18V14H3v-1.5z"/></svg>${formattedNum}`;
        };
//#endregion === CURRENCY FORMATTER FUNCTION =============//

//#region === FETCH FINANCIAL YEARS AND POPULATE DROPDOWN =============//
        // Fetch available years from database and build the dropdown nodes
        async function initializeYearDropdown() {
        try {
        const response = await fetch('/api/financial-years');
        if (!response.ok) throw new Error("Failed to load years layout matrix");
        const yearsArray = await response.json();

        // Clear layout placeholder items
        yearSelector.innerHTML = '';

        // Generate dynamic dropdown values
        yearsArray.forEach((year, index) => {
            const optionNode = document.createElement('option');
            optionNode.value = year;
            optionNode.textContent = year;
            
            // Auto-select the first (most recent) year in the array sequence
            if (index === 0) optionNode.selected = true;

            yearSelector.appendChild(optionNode);
        });

        // 2. Once the dropdown is populated, run initial chart rendering
        fetchAnalyticsData();
         } catch (err) {
        console.error("Year dropdown population failed: ", err);
        // Fallback safety setting in case connection fails
        yearSelector.innerHTML = `<option value="${new Date().getFullYear()}">${new Date().getFullYear()}</option>`;
        fetchAnalyticsData();
    }
}
//#endregion === FETCH FINANCIAL YEARS AND POPULATE DROPDOWN =============//

//#region === FETCH FINANCIAL DATA AND RENDER CHART START=============//
        async function fetchAnalyticsData() {
            try {
                const selectedYear = yearSelector.value;
                if (!selectedYear) return; // Wait until dropdown is populated
                const response = await fetch(`/api/monthly-financials?year=${selectedYear}`);
                
                if (!response.ok) throw new Error("Server responded with error status code");
                const databaseData = await response.json();
                
                renderActiveBars(databaseData);
            } catch (err) {
                console.error("UI Render Exception: ", err);
                chartContainer.innerHTML = `<p style='color:#e57373; text-align:center; width:100%; font-weight:bold;'>Unable to load data layers from your Node database API.</p>`;
            }
        }
//#endregion === FETCH FINANCIAL DATA AND RENDER CHART END =============//

//#region === RENDER BAR CHART LAYOUT NODES START =============//
function renderActiveBars(financialData) {
    chartContainer.innerHTML = '';
    // 1. Establish summation trackers for yearly performance aggregates
    let yearlySalesSum = 0;
    let yearlyExpensesSum = 0;
    let yearlyPurchasesSum = 0;
    let maxVal = 0;

    financialData.forEach(item => {
        const totalExp = item.compExpense + item.purchase;
        // Sum total annual fields
        yearlySalesSum += item.sales;
        yearlyExpensesSum += item.compExpense;
        yearlyPurchasesSum += item.purchase;

        if (item.sales > maxVal) maxVal = item.sales;
        if (totalExp > maxVal) maxVal = totalExp;
    });
    
    if (maxVal === 0) maxVal = 1;

    // 2. Format and inject text markers directly into the right-side summary card panel nodes
    const selectedYearText = yearSelector.value || new Date().getFullYear();
    document.getElementById('cardYearTitle').textContent = `${selectedYearText} Financials`;
    document.getElementById('totalSalesVal').innerHTML = formatCurrency(yearlySalesSum);
    document.getElementById('totalExpVal').innerHTML = formatCurrency(yearlyExpensesSum);
    document.getElementById('totalPurchVal').innerHTML = formatCurrency(yearlyPurchasesSum);
    // Calculate dynamic profit net operational margins
    const overallTotalExpensesCombined = yearlyExpensesSum + yearlyPurchasesSum;
    const yearlyNetMargin = yearlySalesSum - overallTotalExpensesCombined;
    const marginContainer = document.getElementById('netMarginVal');
    
    marginContainer.innerHTML = formatCurrency(yearlyNetMargin);
    if (yearlyNetMargin >= 0) {
        marginContainer.className = "metric-value margin-positive";
    } else {
        marginContainer.className = "metric-value margin-negative";
    }
    // 3. Render your bar chart columns layout nodes
    const staticSvgSymbol = `<svg viewBox="0 0 24 24" style="width:11px; height:11px; fill:currentColor; margin-right:2px; vertical-align:middle; display:inline-block;"><path d="M5 3h6c4.418 0 8 3.582 8 8s-3.582 8-8 8H5V3zm2 2v12h4c3.314 0 6-2.686 6-6s-2.686-6-6-6H7zM3 9h18v1.5H3V9zm0 3.5h18V14H3v-1.5z"/></svg>`;

    financialData.forEach(item => {
        const totalExpenses = item.compExpense + item.purchase;
        const netMargin = item.sales - totalExpenses;        
        const salesPercentage = (item.sales / maxVal) * 100;
        const expensePercentage = (totalExpenses / maxVal) * 100;
        const groupWrapper = document.createElement('div');
        groupWrapper.className = 'month-group';

        groupWrapper.innerHTML = `
            <div class="bars-flex">
                <div class="bar sales" style="height: ${salesPercentage}%; width: 10px;" data-type="sales" data-exact="${item.sales}">
                     <span class="bar-value">${staticSvgSymbol}${Math.round(item.sales / 1000)}k</span>
                </div>
                <div class="bar expenses" style="height: ${expensePercentage}%;" data-type="expenses" data-exact="${totalExpenses}" data-company="${item.compExpense}" data-purchase="${item.purchase}">
                     <span class="bar-value">${staticSvgSymbol}${Math.round(totalExpenses / 1000)}k</span>
                </div>
            </div>
            <div class="bar-label" data-type="month" data-month="${item.month}" data-sales="${item.sales}" data-expenses="${totalExpenses}" data-margin="${netMargin}">
                 ${item.month}
            </div>
        `;
        chartContainer.appendChild(groupWrapper);
    });
}
//#endregion === RENDER BAR CHART LAYOUT NODES END =============//

//#region === TOOL TIP POSTING CODE START =============//

        wrapper.forEach(function(item) {
        item.addEventListener('mouseover', function(e) {
            const target = e.target.closest('[data-type]');
            if (!target) return; // Exit if hovering over something else 
            const dataType = target.getAttribute('data-type');
            if (!dataType) return;
            let htmlContent = '';
            
             if (dataType === 'sales') {
                htmlContent = `<div class="tooltip-row"><span>Gross Sales Revenue:</span><span class="tooltip-bold">${formatCurrency(target.getAttribute('data-exact'))}</span></div>`;
            } 
            else if (dataType === 'expenses') {
                htmlContent = `
                    <div class="tooltip-row"><span>Company Expenditures:</span><span>${formatCurrency(target.getAttribute('data-company'))}</span></div>
                    <div class="tooltip-row"><span>Inventory Purchases:</span><span>${formatCurrency(target.getAttribute('data-purchase'))}</span></div>
                    <hr style="border:0; border-top:1px solid #444; margin:6px 0;">
                    Total Aggregate Cost:${formatCurrency(target.getAttribute('data-exact'))}
                    `;
                    }
            else if (dataType === 'month') {
                    const mMargin = parseFloat(target.getAttribute('data-margin'));
                    const marginColor = mMargin >= 0 ? '#81c784' : '#e57373';
                    htmlContent = `
                    <div style="font-weight:bold; margin-bottom:4px; text-align:center; border-bottom:1px solid #444; padding-bottom:2px;">${target.getAttribute('data-month')} Financial Summary</div>
                        <div class="tooltip-row"><span>Total Sales:</span><span>${formatCurrency(target.getAttribute('data-sales'))}</span></div> 
                        <div class="tooltip-row"><span>Total Expense:</span><span>${formatCurrency(target.getAttribute('data-expenses'))}</span></div>
                         <div class="tooltip-row"><span>Net Margin Profit:</span><span style="font-weight:bold; color:${marginColor};">${formatCurrency(mMargin)}</span>
                    </div>`;
      }
            else if (dataType === 'invoices-rows') {
                            // New logic: pull the hidden customer name out of the row attributes
                    const customer = target.getAttribute('data-customer');
                    const invNo = target.getAttribute('data-invoice');
                    const amount = target.getAttribute('data-amount');
                    const pdc = target.getAttribute('data-pdc');
                    const payDate = target.getAttribute('data-paydate');     
                       htmlContent = `

                        <div class="tooltip-row" style="font-size: 14px; color: #ffffff; margin-bottom: 2px; text-align: left;">
                             <span style="font-weight: 500;">Invoice #:</span> 
                             <span class="text-primary" style="font-weight: 600;">${invNo}</span>
                        </div>
                        <div class="tooltip-row" style="font-size: 14px; color: #ffffff; margin-bottom: 2px;">
                              <span style="font-weight: 500;">Customer:</span> 
                              <span class="text-primary" style="font-weight: 600;">${customer}</span>
                        </div>
                        <div class="tooltip-row" style="font-size: 14px; color: #ffffff; margin-bottom: 2px;">
                              <span style="font-weight: 500;">Amount:</span> 
                              <span class="text-primary" style="font-weight: 600;">${amount}</span>
                        </div>
                        <div class="tooltip-row" style="font-size: 14px; color: #ffffff; margin-bottom: 2px;">
                              <span style="font-weight: 500;">Cheque #:</span> 
                              <span class="text-Secondary" style="font-weight: 600;">${pdc}</span>
                        </div>
                        <div class="tooltip-row" style="font-size: 14px; color: #ffffff; margin-bottom: 2px;">
                              <span style="font-weight: 500;">Pay Date:</span> 
                              <span class="text-primary" style="font-weight: 600;">${formatToDdMMMyyyy(payDate)}</span>
                        </div>
                        <div>
                              <label style="font-size: 12px; color: gold; font-weight: 400; margin-left: 4px;">Click any Row to Select One Cheque with multiple Invoices</label>
                        </div> `;
                        }
      window.parent.postMessage({ action: 'showTooltip', html: htmlContent }, '*');
      }, true);
  });
//#endregion === TOOL TIP POSTING CODE END =============//

//#region === TOOL TIP POSTING CODE MOVE AND HIDE EVENTS =============//
     
      wrapper.forEach(function(item) {
      item.addEventListener('mousemove', function(e) {
        //console.log(wrapper);
          const target = e.target.closest('[data-type]');
          if (!target) return;
          const dataType = target.getAttribute('data-type');
          if (!dataType) return;
          if (dataType === 'invoices-rows') {
      window.parent.postMessage({ action: 'moveTooltip', clientX: right= 500 , clientY: top = 200 }, '*');
          } else if (dataType === 'expenses' || dataType === 'sales' || dataType === 'month') {
              window.parent.postMessage({ action: 'moveTooltip', clientX: e.clientX, clientY: e.clientY }, '*');
          }

      });
    });
 
      wrapper.forEach(function(item) {
      item.addEventListener('mouseout', function(e) {
      if (e.target.classList.contains('bar-chart') || e.target.classList.contains('bar-label') || e.target.classList.contains('summary-sidebar-card') || e.target.classList.contains('summary-sidebar-card2') || e.target.closest('[data-type]')) {
      window.parent.postMessage({ action: 'hideTooltip' }, '*');
      }
      }, true);
      });
//#endregion === TOOL TIP POSTING CODE MOVE AND HIDE EVENTS =============//   

//#region === YEAR DROPDOWN CHANGE EVENTS STARTS =============//
yearSelector.addEventListener('change', fetchAnalyticsData);
initializeYearDropdown();
//====CHART======//
//#endregion === YEAR DROPDOWN CHANGE EVENTS ENDS =============//

//#region === DASHBOARD DATE FORMAT FUNCTION STARTS====================//
    function formatDashboardDate(dateString) {
    if (!dateString || dateString === '--') return '--';
    // 💡 Pulls the exact year, month, and day characters directly out of the SQL date string
    const match = dateString.match(/(\d{4})-(\d{2})-(\d{2})/);    
    if (!match) return '--';
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // JavaScript months are 0-indexed (Jan is 0, Aug is 7)
    const day = parseInt(match[3], 10);
    // 🔒 Creates a pure local date at midnight, neutralizing the UTC timezone shift
    const date = new Date(year, month, day);
    // Final clean output render (e.g., "Aug 1, 2026")
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
}      
//#endregion =================== DASHBOARD DATE FORMAT FUNCTION ENDS====================//  

//#region === RANGE FILTER CHANGE EVENT =================//
fetchDashboardMatrix();

document.getElementById("dash-filter-range").addEventListener("change", (event) => {
    fetchDashboardMatrix();
    });
//#endregion === RANGE FILTER CHANGE EVENT =================//

//#region === FETCH DASHBOARD METRICS FUNCTION STARTS====================//    
function setDashboardCardAmount(id, amount) {
    const element = document.getElementById(id);
    if (!element) return;
    const currency = document.createElement('span');
    currency.className = 'dashboard-currency';
    currency.setAttribute('aria-label', 'UAE dirhams');
    currency.innerHTML = '<svg class="dashboard-dirham-symbol" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M5 3h6c4.418 0 8 3.582 8 8s-3.582 8-8 8H5V3zm2 2v12h4c3.314 0 6-2.686 6-6s-2.686-6-6-6H7zM3 9h18v1.5H3V9zm0 3.5h18V14H3v-1.5z"/></svg>';
    const value = document.createElement('span');
    value.className = 'dashboard-amount';
    value.textContent = String(amount ?? '--,--');
    element.replaceChildren(currency, document.createTextNode(' '), value);
}

function fetchDashboardMatrix(){
        const payload = {
                  timeRange: document.getElementById("dash-filter-range").value
                };
                //console.log(payload)
            fetch("/api/dashboard-metrics",{
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
            }) // Replace with your actual backend endpoint URL
        .then(response => response.json())
        .then(data => {
            const formattedFrom = formatToDdMMMyyyy(data.fromDate);
            const formattedTo = formatToDdMMMyyyy(data.toDate);
            // Update Metric Cards
            setDashboardCardAmount('total-receivables', data.totalReceivables);
            setDashboardCardAmount('total-expenses', data.expensesTotal);
            setDashboardCardAmount('total-purchases', data.procurementCost);
            setDashboardCardAmount('net-margin', data.netLiquidity);
            document.getElementById('total-out').textContent = `${data.outOfStock}`;
            // Wrap the formatted dates inside styled spans using .innerHTML
            document.getElementById('muted-text').innerHTML = `
                Real-time Invoices, Expenses, Purchases and Inventory from &nbsp;&nbsp; 
                <span class="text-danger fw-bold">${formattedFrom}</span> &nbsp; to &nbsp;
                <span class="text-danger fw-bold">${formattedTo}</span>
            `;
           
             rowTable.innerHTML = "";
         // Loop through each database record
        data.latestTransactions.forEach(row => {
      // Create a new table row
      const tr = document.createElement('tr');
       // ADD THIS: Attach data attributes for your tooltip listener to read
        tr.setAttribute('data-type', 'invoices-rows');
        tr.setAttribute('data-customer', row.customer); // Make sure 'CustomerName' matches your DB field name
        tr.setAttribute('data-invoice', row.invNumber);
        tr.setAttribute('data-amount', row.GrandTotal);
        tr.setAttribute('data-pdc', row.ChqNo);
        tr.setAttribute('data-paydate', row.issueDate);
      
      // Populate the row with table data cells
      tr.innerHTML = `
        <td><input type="checkbox" class="row-select"></td>
        <td style="font-size: 14px; font-weight: bold; color: blue; text-align: center;">${formatToDdMMMyyyy(row.issueDate)}</td>
        <td style="font-size: 14px; font-weight: bold; color: blue; text-align: center;">${row.ChqNo}</td>
        <td style="font-size: 14px; font-weight: bold; color: blue; text-align: right;">${parseFloat(row.GrandTotal || 0).toFixed(2)}</td>
        <td style="font-size: 14px; font-weight: bold; color: blue; text-align: center;">${row.invNumber}</td>
        
        
        
        
      `;
      
      // Append the row to the tbody
      rowTable.appendChild(tr);
    });
    });
   }
//#endregion ===== FETCH DASHBOARD METRICS FUNCTION ENDS====================//

//#region === PDC TABLE ITEMS SELECTION CODE =====//
const table = document.getElementById('pdc-table');
const totalDisplay = document.getElementById('select-amount');
const selectedChequeDisplay = document.getElementById('selected-Chq');
const invoiceCount = document.getElementById('select-no');
const updatePdc = document.getElementById('btn-pdc-update');
// 1. Function to calculate the total amount of all checked items
function updateTotalAmount() {
  let total = 0;
  
  // Find all unique rows that are currently marked as selected
  const selectedRows = table.querySelectorAll('tbody tr.selected-row');
  
  selectedRows.forEach(row => {
    const amount = parseFloat(row.getAttribute('data-amount')) || 0;
    total += amount;
  });

  // Format the number to 2 decimal places
  totalDisplay.innerHTML = `Amount:&nbsp;${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// 2. Event listener for row clicks
table.querySelector('tbody').addEventListener('click', function(e) {
  // Find the closest row element that was clicked
  const row = e.target.closest('tr');
  if (!row || row.classList.contains('disabled-row')) return;

  const checkbox = row.querySelector('.row-select');
  const chequeNumber = row.getAttribute('data-pdc');
  if (!chequeNumber || !checkbox) return;

  // Determine the target state. 
  // If the user clicked the checkbox directly, use its current state.
  // If they clicked the row, toggle what the checkbox state WAS.
  let targetCheckedState = (e.target === checkbox) ? checkbox.checked : !checkbox.checked;
  // Find all rows sharing this cheque number
  const matchingRows = table.querySelectorAll(`tr[data-pdc="${chequeNumber}"]`);
//console.log(`Toggling ${matchingRows.length} rows for cheque number: ${chequeNumber} to ${targetCheckedState ? 'checked' : 'unchecked'}`);
  // Batch update all rows in the group
  if (targetCheckedState) {
    selectedChequeDisplay.innerHTML = `PDC:&nbsp;${chequeNumber}`;    
    invoiceCount.innerHTML = `Count:&nbsp;${matchingRows.length}`;
    updatePdc.classList.remove('disabled');
  }else {
    selectedChequeDisplay.innerHTML = `PDC:&nbsp;`;
    invoiceCount.innerHTML = `Count:&nbsp;`;
    updatePdc.classList.add('disabled');
  }
  matchingRows.forEach(matchingRow => {
    const box = matchingRow.querySelector('.row-select');
    if (box) box.checked = targetCheckedState;

    if (targetCheckedState) {
      matchingRow.classList.add('selected-row');
    } else {
      matchingRow.classList.remove('selected-row');
    }
  });
// 3. LOCK/UNLOCK Logic for different cheque numbers
  // Check if there is still at least one active selection in the table
  const staticActiveSelection = table.querySelector('tbody tr.selected-row');
  const allRows = table.querySelectorAll('tbody tr');

  allRows.forEach(currentRow => {
    const currentCheque = currentRow.getAttribute('data-pdc');
    const currentBox = currentRow.querySelector('.row-select');
    if (staticActiveSelection) {
      // If a group is selected, disable everything that doesn't match its cheque number
      if (currentCheque !== chequeNumber) {
        currentRow.classList.add('disabled-row');
        if (currentBox) currentBox.disabled = true;
      }
    } else {
      // If nothing is selected at all, re-enable every row in the table
      currentRow.classList.remove('disabled-row');
      if (currentBox) currentBox.disabled = false;
    }
  });
   const SelectionInv = table.querySelectorAll('tbody tr.selected-row');
   // 2. Convert the HTML rows directly into a single array of strings
      selectedInvoices = Array.from(SelectionInv).map(SelectedRow => {
      return SelectedRow.getAttribute('data-invoice');
      
});
    // console.log(selectedInvoices);
  // Recalculate totals after updating states
  updateTotalAmount();
});
    document.getElementById("btn-pdc-update").addEventListener("click", () => {
    // PDCtitle.textContent = selectedInvoices.join(", ");
     // Safety check: Don't send an empty request
    if (selectedInvoices.length === 0) {
        alert("Please select at least one invoice.");
        return;
    }

     // 2. Send the data to your backend API route
    fetch('/api/update-pdc-status', { // Replace with your actual backend URL
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            invoiceIds: selectedInvoices,
            status: 'Paid' // or whatever status you want to set
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`Invoices ${selectedInvoices.join(", ")} successfully marked as paid!`);
            // Optional: Reload the table data or update row UI styles here
             fetchDashboardMatrix(); // Refresh the dashboard metrics and table
        } else {
            alert("Database update failed: " + data.message);
        }
    })
    .catch(error => {
        console.error("Network Error:", error);
    });

    });
    
    
//#endregion ===  PDC TABLE ITEMS SELECTION CODE =====
}
//#endregion 📌==== DASHBOARD PAGE CODE ALL END  HERE =====//
//========================================================================//

//===============================INVOICES===========================================//
//#region 📌 INVOICES PAGE CODE ALL INSERT  HERE

function initInvoicesPage() {
// Global variable to keep track of the row currently being edited
let activeEditingRow = null; 
let TotalInv = "";
const rowTable = document.getElementById('pdcclear-modal-items-rows');
// --- GLOBAL CORE LOGIC (Place this in your main script body or inside a DOMContentLoaded block) ---
const durationSelect = document.getElementById("statement-duration-select"); // Make sure this matches your HTML ID
const fromDateInput = document.getElementById("statement-from-date");       // Make sure this matches your HTML ID
const toDateInput = document.getElementById("statement-to-date");           // Make sure this matches your HTML ID
//#region  OLD CLOSE MODAL, UNLOCK PARENT MENU, REFRESH IFRAME
              // // 3. Generic Modal Deactivation & Layout Restorer
              // function closeAppModal(modalId) {
              //   const modal = document.getElementById(modalId);
              //   if (!modal) return;
              //   modal.style.display = "none";
              //   //document.getElementById("edit-invoice-master-form").reset();
              //   //document.getElementById("inv-modal-items-rows").innerHTML = "";

              //   document.getElementById("payment-transaction-form").reset();
              //   document.getElementById("invitems-transaction-form").reset();
                

              //   // Pattern Matching Scanner: Checks if ANY structural modal container layout is active
              //   const genericModalOpen = Array.from(
              //     document.querySelectorAll('[id$="-modal-overlay"]')).filter((m) => m.style.display === "flex").length;

              //   if (genericModalOpen === 0) {
              //     lockSidebarAndRefresh(false);
              //   }

              //   // 1. Unlock the parent window mechanisms
              //   if (window.parent && window.parent.lockSidebarAndRefresh && genericModalOpen === 0 ) {
              //     window.parent.lockSidebarAndRefresh(false);
              //   }

              //   // 2. Remove the local iframe listener
              //   window.removeEventListener("keydown", localIframeBlockRefresh);
              // }

              // // Helper to block keystrokes inside the frame body
              // function localIframeBlockRefresh(e) {
              //   if (
              //     e.key === "F5" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r")) 
              //     {
              //     e.preventDefault();
              //     alert(
              //       "Please save your changes or close the active workspace panel before refreshing the system window.",
              //     );
              //   }
              // }
              // // 4. Global Hardware App Grid Lock Controls
              // function lockSidebarAndRefresh(shouldLock) {
              //   const sidebar =
              //     window.parent.document.querySelector(".sidebar-pane");
              //   if (!sidebar) return;

              //   if (shouldLock) {
              //     sidebar.classList.add("menu-locked");
              //     window.parent.document.addEventListener(
              //       "keydown",
              //       blockRefreshKeys,
              //     );
              //     window.parent.document.addEventListener(
              //       "beforeunload",
              //       preventPageUnload,
              //     );
              //   } else {
              //     sidebar.classList.remove("menu-locked");
              //     window.parent.document.removeEventListener(
              //       "keydown",
              //       blockRefreshKeys,
              //     );
              //     window.parent.document.removeEventListener(
              //       "beforeunload",
              //       preventPageUnload,
              //     );
              //   }
              // }
              // // Intercepts and blocks F5, Ctrl+R, and Cmd+R commands
              // function blockRefreshKeys(e) {
              //   if (
              //     e.key === "F5" ||
              //     ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r")
              //   ) {
              //     e.preventDefault();
              //     alert(
              //       "Please save your changes or close the active workspace panel before refreshing the system window.",
              //     );
              //   }
              // }

              // // Triggers a browser warning popup if they try to use the browser UI refresh button
              // function preventPageUnload(e) {
              //   e.preventDefault();
              //   e.returnValue = "";
              // }

//#endregion
//#region  OPEN ITEMS EDIT DYNAMIC CONTEXT MENU //
                document.getElementById("inv-modal-items-rows").addEventListener("contextmenu", function (e) {
                const clickedRow = e.target.closest("tr");
                // if (!clickedRow) return;
                // const cells = clickedRow.getElementsByTagName("td");
                // if (!cells || cells.length < 1) return; 
                // Exit if clicking outside a row, or if clicking an input/button inside the row
                if (!clickedRow || e.target.tagName === "INPUT" || e.target.tagName === "BUTTON") return;
                if (!clickedRow || clickedRow.classList.contains('table-danger')) {
                  e.preventDefault();
                  alert("This row is a Credit Note item and cannot be edited. Please select a valid invoice item row.");
                  return; 
              }

  
                e.preventDefault();
                
                
                // Highlight row visually
                  document.querySelectorAll("#inv-modal-items-rows tr").forEach((row) =>
                      row.classList.remove("editinvo-row-highlight-context"),
                    );
                  clickedRow.classList.add("editinvo-row-highlight-context");

                const menuElement = document.getElementById("editinvo-context-menu");
                
                // 1. Unhide it instantly so the browser can calculate its true width and height
                menuElement.style.display = "block";
                
                // 2. Get your monitor window sizes and menu sizes
                const menuWidth = menuElement.offsetWidth;
                const menuHeight = menuElement.offsetHeight;
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
                
                // 3. Calculate ideal X (Horizontal) Position
                // If opening to the right goes off-screen, flip it to open to the left
                let targetX = e.clientX;
                if (e.clientX + menuWidth > windowWidth) {
                  targetX = windowWidth - menuWidth - 10; // 10px safety margin from window edge
                }
                
                // 4. Calculate ideal Y (Vertical) Position
                // If opening downward goes off-screen, flip it to open upward instead!
                let targetY = e.clientY;
                if (e.clientY + menuHeight > windowHeight) {
                  targetY = e.clientY - menuHeight; // Shifts the menu completely above your cursor
                  
                  // Safety check: if it hits the absolute top of the viewport
                  if (targetY < 0) targetY = 10; 
                }
                
                // 5. Apply the safe, un-clipped coordinates
                menuElement.style.left = targetX + "px";
                menuElement.style.top = targetY + "px";
                
                e.stopPropagation();
              });


              // 🎯 HIDE MENU SCRIPT: Closes popup if user clicks anywhere else on screen
              document.addEventListener("click", function (e) {
                // 💡 Add a safety check: If right-click was used, don't execute the hide script
              if (e.button === 2) return; 
                const menuElement = document.getElementById(
                  "editinvo-context-menu",
                );
                if (!e.target.closest("#editinvo-context-menu")) {
                  menuElement.style.display = "none";
                  document
                    .querySelectorAll("#inv-modal-items-rows tr")
                    .forEach((row) =>
                      row.classList.remove("editinvo-row-highlight-context"),
                    );
                }
                
  
              });
//#endregion
//#region  CURRENT DATE FORMATING STARTS==================================================//
                const Newcndate = document.getElementById('credit-date');
                //////const cndate = document.getElementById('credit-date');
                //const deldate = document.getElementById('deliver-date');
                // Get today's local date details
                const today = new Date();
                const year = today.getFullYear();
                // Months are 0-indexed; add 1 and pad with a leading zero if single digit
                const month = String(today.getMonth() + 1).padStart(2, '0');
                // Pad the day with a leading zero if single digit
                const day = String(today.getDate()).padStart(2, '0');
                
                // Combine into the required YYYY-MM-DD format
                const formattedDate = `${year}-${month}-${day}`;
                
                // Set the value of the date input
                Newcndate.value = formattedDate;
                //deldate.value = formattedDate;
//#endregion================================CURRENT DATE FORMATING ENDS==================================================//

//#region  MAIN INVOICE CODE 📌
//#region     SCAN ALL MATCHING MODAL AND BUTTONS AND CLOSE ANY MODAL BY ID
              const allModals = document.querySelectorAll(
                '[id$="-modal-overlay"]',
              );
              allModals.forEach((modal) => {
                const modalId = modal.id;
                // Find any element with a .close-modal class inside this overlay container wrapper
                const closeButtons = modal.querySelectorAll(".close-modal, .btn-cancel",);

                // Automatically closes its specific parent modal wrapper scope
                closeButtons.forEach((btn) => {btn.addEventListener("click", function () 
                    {
                    closeAppModal(modalId);
                    });
                    });
              });
//#endregion
//#region     LOAD INVOICES FROM DATABASE
              const btnSearch = document.getElementById("btn-search");
              if (!btnSearch) return;               
              fetchFilteredInvoices();
//#endregion
//#region     INVOICE SEARCH BUTTON CLICK EVENT
              btnSearch.addEventListener("click", fetchFilteredInvoices);

              //================ SEARCH EVENTS FOR RANGE, STATUS, INVOICE NUMBER, CUSTOMER NAME ====================//
              document.getElementById("filter-range").addEventListener("change", (event) => 
                {
                  document.getElementById("filter-start-date").value = "";
                  document.getElementById("filter-end-date").value = "";
                    fetchFilteredInvoices();
                });
              document.getElementById("filter-status").addEventListener("change", (event) => 
                {
                  fetchFilteredInvoices();
                });
              // document.getElementById("search-inv-no").addEventListener("input", () => 
              //   {
              //     fetchFilteredInvoices();
              //   });
              document.getElementById("search-customer").addEventListener("input", () => 
                {
                  fetchFilteredInvoices();
                });
//#endregion
//#region     BUTTON INVOICE RESET CLICK EVENT
              document.getElementById("btn-reset").addEventListener("click", () => 
                {
                  // document.getElementById("search-inv-no").value = "";
                  document.getElementById("search-customer").value = "";
                  document.getElementById("filter-status").value = "ALL";
                  document.getElementById("filter-range").value = "3MONTH";
                  document.getElementById("filter-start-date").value = "";
                  document.getElementById("filter-end-date").value = "";
                  fetchFilteredInvoices();
                });
//#endregion ============ END BUTTON RESET CLICK EVENT ===================================//
//#region     SET ACTIVE SIDEBAR ITEM WHEN CLOSING A MODAL  ======================//
window.setActiveSidebarItem = function(targetHref) {
    // 1. Find all navigation links in your sidebar
    const sidebarLinks = document.querySelectorAll('.sub-menu-container a'); // Adjust selector to your sidebar class
    
    sidebarLinks.forEach(link => {
        // 2. Check if the link's attribute matches your target route
        if (link.getAttribute('href') === targetHref || link.getAttribute('onclick')?.includes(targetHref)) {
            link.classList.add('active'); // Change 'active' to your specific CSS active class
        } else {
            link.classList.remove('active');
        }
    });
}
//#endregion
//#region     CLOSE MODAL, UNLOCK PARENT MENU, REFRESH IFRAME===========//
              // 3. Generic Modal Deactivation & Layout Restorer
              window.closeAppModal = function(modalId) {
                const modal = document.getElementById(modalId);
                if (!modal) return;
                modal.style.display = "none";
                const activeForm = modal.querySelector('.global-master-form');
                activeForm.reset();
                const itemRows = modal.querySelector('.global-modal-items-rows');
                if(itemRows){
                   itemRows.innerHTML ="";
                    // Pattern Matching Scanner: Checks if ANY structural modal container layout is active
                const genericModalOpen = Array.from(
                  document.querySelectorAll('[id$="-modal-overlay"]')).filter((m) => m.style.display === "flex").length;

                if (genericModalOpen === 0) {
                  lockSidebarAndRefresh(false);
                }

                // 1. Unlock the parent window mechanisms
                if (window.parent && window.parent.lockSidebarAndRefresh && genericModalOpen === 0 ) {
                  window.parent.lockSidebarAndRefresh(false);
                }

                // 2. Remove the local iframe listener
                window.removeEventListener("keydown", localIframeBlockRefresh);
                }
                else{

                // modal.querySelector('.global-modal-items-rows').innerHTML = "";

                //document.getElementById("payment-transaction-form").reset();
                //document.getElementById("invitems-transaction-form").reset();
                

                // Pattern Matching Scanner: Checks if ANY structural modal container layout is active
                const genericModalOpen = Array.from(
                  document.querySelectorAll('[id$="-modal-overlay"]')).filter((m) => m.style.display === "flex").length;

                if (genericModalOpen === 0) {
                  lockSidebarAndRefresh(false);
                }

                // 1. Unlock the parent window mechanisms
                if (window.parent && window.parent.lockSidebarAndRefresh && genericModalOpen === 0 ) {
                  window.parent.lockSidebarAndRefresh(false);
                }

                // 2. Remove the local iframe listener
                window.removeEventListener("keydown", localIframeBlockRefresh);
                }
               
              }

              // Helper to block keystrokes inside the frame body
              function localIframeBlockRefresh(e) {
                if (
                  e.key === "F5" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r")) 
                  {
                  e.preventDefault();
                  alert(
                    "Please save your changes or close the active workspace panel before refreshing the system window.",
                  );
                }
              }
              // 4. Global Hardware App Grid Lock Controls
              function lockSidebarAndRefresh(shouldLock) {
                const sidebar =
                  window.parent.document.querySelector(".sidebar-pane");
                if (!sidebar) return;

                if (shouldLock) {
                  sidebar.classList.add("menu-locked");
                  window.parent.document.addEventListener(
                    "keydown",
                    blockRefreshKeys,
                  );
                  window.parent.document.addEventListener(
                    "beforeunload",
                    preventPageUnload,
                  );
                } else {
                  sidebar.classList.remove("menu-locked");
                  window.parent.document.removeEventListener(
                    "keydown",
                    blockRefreshKeys,
                  );
                  window.parent.document.removeEventListener(
                    "beforeunload",
                    preventPageUnload,
                  );
                }
              }
              // Intercepts and blocks F5, Ctrl+R, and Cmd+R commands
              function blockRefreshKeys(e) {
                if (
                  e.key === "F5" ||
                  ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r")
                ) {
                  e.preventDefault();
                  alert(
                    "Please save your changes or close the active workspace panel before refreshing the system window.",
                  );
                }
              }

              // Triggers a browser warning popup if they try to use the browser UI refresh button
              function preventPageUnload(e) {
                e.preventDefault();
                e.returnValue = "";
              }
//#endregion
//#region     FETCH INVOICES FROM DATABASE FUNCTION
              function fetchFilteredInvoices() {
                document.getElementById("inv-head").textContent = `Sales Invoices Registry`;
                const loadingOverlay = document.getElementById("loading-overlay");
                const tableBlock = document.getElementById("table-display-block",);
                const tbody = document.getElementById("invoice-rows");

                loadingOverlay.style.display = "block";
                tableBlock.style.opacity = "0.4";

                const payload = {
                  // InvoiceNo: document.getElementById("search-inv-no").value.trim(),
                  searchQuery: document.getElementById("search-customer").value.trim(),
                  Status: document.getElementById("filter-status").value,
                  timeRange: document.getElementById("filter-range").value,
                  startDate: document.getElementById("filter-start-date").value,
                  endDate: document.getElementById("filter-end-date").value,
                };

                fetch("/api/invoices-ledger", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                })
                  .then((res) => res.json())
                  .then((data) => {
                    tbody.innerHTML = "";
                    loadingOverlay.style.display = "none";
                    tableBlock.style.opacity = "1.0";
                    // console.log("Data received from MongoDB:", data); // Check this in your browser console (F12)
                    if (
                      !data.success ||
                      !data.invoices ||
                      data.invoices.length === 0
                    ) {
                      tbody.innerHTML =
                        '<tr><td colspan="13" class="text-center text-muted py-3">No matching invoice records found inside database registry.</td></tr>';
                      return;
                    }

                    // 1. Extract all dates and convert them to timestamps
                    const timestamps = data.invoices.map(invoice => new Date(invoice.InvoiceDate).getTime());
                    // 2. Find the minimum and maximum timestamps
                    const minTimestamp = Math.min(...timestamps);
                    const maxTimestamp = Math.max(...timestamps);
                    // 3. Convert them back into readable Date objects
                    // const earliestDate = new Date(minTimestamp);
                    // const latestDate = new Date(maxTimestamp);
                    // Set your input date pickers so they match your 3-month calculation boundary
                    if (data.computedDates.from) {
                document.getElementById("filter-start-date").value = data.computedDates.from;
            } else {
                document.getElementById("filter-start-date").value = ""; // Clear if FULL history
            }

            if (data.computedDates.to) {
                document.getElementById("filter-end-date").value = data.computedDates.to;
            } else {
                document.getElementById("filter-end-date").value = ""; // Clear if FULL history
            }
                    

                    TotalInv = "";
                    TotalInv = data.invoices.length;//total quotations count
                    document.getElementById("inv-head").innerHTML = `Invoices (${TotalInv})`;
                    const now = new Date();
                    document.getElementById("inv-head-date").innerHTML = formatToDdMMMyyyy(now);

                    data.invoices.forEach((inv) => {
                      const row = document.createElement("tr");

                      // 2. 💡 CRITICAL FIX: Set your data markers directly onto the element object wrapper!
                      row.setAttribute('data-id', inv.ID || "");
                      row.setAttribute('data-customer', inv.Customer || "");
                      row.setAttribute('data-invno', inv.InvoiceNo || "");
                      row.setAttribute('data-emirate', inv.Emirate || "");
                      row.setAttribute('data-chqno', inv.ChqNo || "");
                      row.setAttribute('data-amount', inv.GrandTotal || "");
                      row.setAttribute('data-balance', inv.Balance || 0);
                      row.setAttribute('data-invdate', inv.InvoiceDate || "");
                      row.setAttribute('data-inwords', inv.InWords || "");

                      let badgeClass = "text-danger";
                      let rowTextColorStyle = ""; // 🎯 Holder for row inline color styles
                      // 2. 🎨 MAP ROW TEXT COLOR DIRECTLY TO FINANCIAL REGISTRY STATUSES
                      const statusValue = (inv.Status || "PENDING").toUpperCase();

                      if (statusValue === "PAID") {
                        badgeClass = "bg-success";
                        rowTextColorStyle = "color: green;"; // green
                      } else if (statusValue === "PENDING") {
                        badgeClass = "bg-warning text-dark";
                        rowTextColorStyle = "color: red;"; // red
                      } else if (statusValue === "PDC") {
                        badgeClass = "bg-info text-dark";
                        rowTextColorStyle = "color: purple;"; // purple
                      } else if (
                        statusValue === "ADV.PAID" ||
                        statusValue === "ADVANCE PAID"
                      ) {
                        badgeClass = "bg-danger";
                        rowTextColorStyle = "color: blue;"; //  blue text row
                      }
                      // 3. Inject the style attribute directly into the opening <tr> element node
                      if (rowTextColorStyle) {
                        row.setAttribute("style", rowTextColorStyle);
                      }

                      row.innerHTML = `
                        
                        <td class="col-width-id">${inv.ID || "N/A"}</td> <!-- 🎯 ADDED CLASS HERE TO HIDE CELL -->
                        <td>${inv.InvoiceNo || "N/A"}</td>
                        <td>${formatToDdMMMyyyy(inv.InvoiceDate)}</td>
                        <td>${inv.LPONo?.trim() || ""}</td>
                        <td>${inv.Customer || "CASH"}</td>
                        <td style = "text-align: right">${parseFloat(inv.GrandTotal || 0).toFixed(2)}</td>
                        <td style = "text-align: right">${inv.Received ? parseFloat(inv.Received).toFixed(2) : ""}</td>
                        <td style = "text-align: right">${inv.CNPaid ? parseFloat(inv.CNPaid).toFixed(2) : ""}</td>
                        <td style = "text-align: right">${parseFloat(inv.Balance || 0).toFixed(2)}</td>
                        <td>${inv.Status || "Pending"}</td>
                        <td>${inv.CNNumber || ""}</td>
                        <td>${inv.CreditDate ? formatToDdMMMyyyy(inv.CreditDate) : ""}</td>
                        <td style = "text-align: right">${inv.CNAmount ? parseFloat(inv.CNAmount).toFixed(2) : ""}</td>
                        <td>${inv.Mode || ""}</td>
                        <td>${inv.Receiveddate ? formatToDdMMMyyyy(inv.Receiveddate) : ""}</td>
                        <td>${inv.ChqNo || ""}</td>
                        
                        
                        
                    `;
                      tbody.appendChild(row);
                    });
                  })
                  .catch((err) => {
                    console.error("Critical rendering pipeline issue:", err);
                    loadingOverlay.style.display = "none";
                    tableBlock.style.opacity = "1.0";
                    tbody.innerHTML =
                      '<tr><td colspan="13" class="text-center text-danger py-3">Error streaming dataset values. Check server connection metrics.</td></tr>';
                  });
              }
              // 🎯 GLOBAL STORAGE TRACKER FOR THE ACTIVE SELECTED INVOICE DATA
              let activeSelectedInvoiceNo = null;
              let activeSelectedInvoiceId = null;
              let activeSelectedInvDate = null;
              let activeSelectedInwords = null;
              let activeSelectedEmirate = null;
//#endregion
//#region     OPEN INVOICES DYNAMIC CONTEXT MENU
              document.getElementById("invoice-rows").addEventListener("contextmenu", function (e) {
                  const clickedRow = e.target.closest("tr");
                  if (!clickedRow) return;
                  // const cells = clickedRow.getElementsByTagName("td");
                  // if (!cells || cells.length < 13) return; // Ignore loose spaces or empty rows
                  e.preventDefault();
                  // ⚡ INSTANT READ: Bypasses innerText geometry checks completely!
                  activeSelectedInvoiceId = clickedRow.getAttribute("data-id") || "";
                  activeSelectedInvoiceNo = clickedRow.getAttribute("data-invno") || "";
                  activeSelectedCustomer = clickedRow.getAttribute("data-customer") || "";
                  activeSelectedChqNo = clickedRow.getAttribute("data-chqno") || "";
                  activeSelectedEmirate = clickedRow.getAttribute("data-emirate") || "";
                  activeSelectedAmount = clickedRow.getAttribute("data-amount") || "";
                  activeSelectedBalance = clickedRow.getAttribute("data-balance") || "";
                  activeSelectedInvDate = clickedRow.getAttribute("data-invdate") || "";
                  activeSelectedInwords = clickedRow.getAttribute("data-inwords") || "";

                  activeSelectedInvoiceNo = activeSelectedInvoiceNo.replace(/<[^>]*>/g, "").trim();
                  //console.log(`[ERP DEBUG] Fast Lock: ${activeSelectedInvoiceNo}`);
                // ⚡ OPTIMIZATION 1: Clear ONLY the single previously highlighted row instead of looping through all rows
                const oldHighlightedRow = document.querySelector("#invoice-rows tr.invoices-row-highlight-context");
                if (oldHighlightedRow) {
                  oldHighlightedRow.classList.remove("invoices-row-highlight-context");
                }
                clickedRow.classList.add("invoices-row-highlight-context");

                const menuElement = document.getElementById("invoices-context-menu");
                // ⚡ OPTIMIZATION 2: Pre-set display styles before reading geometric layout sizes
                menuElement.style.visibility = "hidden"; // Render invisibly first so it takes shape in the DOM
                menuElement.style.display = "block";


                  // Highlight row visually
                  // document.querySelectorAll("#invoice-rows tr").forEach((row) => row.classList.remove("invoices-row-highlight-context"),);
                  // clickedRow.classList.add("invoices-row-highlight-context");

                  //const menuElement = document.getElementById("invoices-context-menu",);
                  
                  // menuElement.style.display = "block";
                  //menuElement.style.left = e.clientX + "px";
                  //menuElement.style.top = e.clientY + "px";
                  // 2. Get your monitor window sizes and menu sizes
                const menuWidth = menuElement.offsetWidth || 150;
                const menuHeight = menuElement.offsetHeight || 120;
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;

                // 3. Calculate ideal X (Horizontal) Position
                // If opening to the right goes off-screen, flip it to open to the left
                let targetX = e.clientX;
                if (e.clientX + menuWidth > windowWidth) {
                  targetX = windowWidth - menuWidth - 10; // 10px safety margin from window edge
                }
                
                // 4. Calculate ideal Y (Vertical) Position
                // If opening downward goes off-screen, flip it to open upward instead!
                let targetY = e.clientY;
                if (e.clientY + menuHeight > windowHeight) {
                  targetY = e.clientY - menuHeight; // Shifts the menu completely above your cursor
                  
                  // Safety check: if it hits the absolute top of the viewport
                  if (targetY < 0) targetY = 10; 
                }
                
                // 5. Apply the safe, un-clipped coordinates
                menuElement.style.left = targetX + "px";
                menuElement.style.top = targetY + "px";
                menuElement.style.visibility = "visible"; 
                e.stopPropagation();
                });

              // 🎯 HIDE MENU SCRIPT: Closes popup if user clicks anywhere else on screen
              document.addEventListener("click", function (e) {
                const menuElement = document.getElementById(
                  "invoices-context-menu",
                );
                if (!e.target.closest("#invoices-context-menu")) {
                  menuElement.style.display = "none";
                  document
                    .querySelectorAll("#invoice-rows tr")
                    .forEach((row) =>
                      row.classList.remove("invoices-row-highlight-context"),
                    );
                }
              });
//#endregion
//#region     INVOICE CALCULATE GRAND TOTAL OLD  =========================//
            function calculateGrandtotal() {
            let grossTaxable = 0;
            let grossVat = 0;
            let grossUnitTotal = 0;
            let grossUnitCost = 0;
            let grossUnitMargin = 0;

            // 1. Gather all dynamic rows currently present inside the table body
            const taxableCells = document.querySelectorAll('.row-taxable');
            const vatCells = document.querySelectorAll('.row-vattotal');
            const totalCells = document.querySelectorAll('.row-unittotal');
            const costCells = document.querySelectorAll('.row-unitcost');
            const marginCells = document.querySelectorAll('.row-unitmargin');

            // 2. Loop through and aggregate the values
            taxableCells.forEach(cell => grossTaxable += parseFloat(cell.textContent) || 0);
            vatCells.forEach(cell => grossVat += parseFloat(cell.textContent) || 0);
            totalCells.forEach(cell => grossUnitTotal += parseFloat(cell.textContent) || 0);
            costCells.forEach(cell => grossUnitCost += parseFloat(cell.textContent) || 0);
            marginCells.forEach(cell => grossUnitMargin += parseFloat(cell.textContent) || 0);

            // 3. Render the output directly inside your summary text inputs
            document.getElementById('newinv-taxable-value').value = grossTaxable.toFixed(2);
            document.getElementById('newinv-total-vat').value = grossVat.toFixed(2);
            document.getElementById('newinv-grand-total').value = grossUnitTotal.toFixed(2);
            document.getElementById('newinv-t-cost').value = grossUnitCost.toFixed(2);
            document.getElementById('newinv-t-margin').value = grossUnitMargin.toFixed(2);
            const WordAmount = toWordsConfig.convert(grossUnitTotal)
            document.getElementById('newinv-amount-in-words').value = WordAmount;
            }
//#endregion
//#region     CALCULATE GRAND TOTAL INVOICE
            function calculateInvGrandtotal() {
            let grossTaxable = 0;
            let grossVat = 0;
            let grossUnitTotal = 0;
            let invPaid = 0;
            let invBalace = 0;
            let grossUnitCost = 0;
            let grossUnitMargin = 0;

            // 1. Gather all dynamic rows currently present inside the table body
            const taxableCells = document.querySelectorAll('.row-taxable');
            const vatCells = document.querySelectorAll('.row-vattotal');
            const totalCells = document.querySelectorAll('.row-unittotal');
            const costCells = document.querySelectorAll('.row-unitcost');
            const marginCells = document.querySelectorAll('.row-unitmargin');

           
            
            // 2. Loop through and aggregate the values
            taxableCells.forEach(cell => grossTaxable += parseFloat(cell.textContent) || 0);
            vatCells.forEach(cell => grossVat += parseFloat(cell.textContent) || 0);
            totalCells.forEach(cell => grossUnitTotal += parseFloat(cell.textContent) || 0);
            costCells.forEach(cell => grossUnitCost += parseFloat(cell.textContent) || 0);
            marginCells.forEach(cell => grossUnitMargin += parseFloat(cell.textContent) || 0);

            invPaid = document.getElementById('edit-paid-value').value
            const paidAmount = parseFloat(invPaid);
            const invoiceTotal = parseFloat(grossUnitTotal);
            invBalace = invoiceTotal - paidAmount;
           document.getElementById('edit-balance-value').value = invBalace.toFixed(2);

              if (parseFloat(grossUnitTotal) === paidAmount) {
                document.getElementById('edit-status-value').value = "Paid";
                
              }
              else if (parseFloat(grossUnitTotal) === invBalace) {
                document.getElementById('edit-status-value').value = "Pending";
              }
              else{
                document.getElementById('edit-status-value').value = "Adv.Paid";
              }

              // 1. First, populate the text field with the string value from your database
                      const statusFromDatabase = document.getElementById('edit-status-value').value;
                      const liveStatus = document.getElementById('edit-status-value');

                      liveStatus.value = statusFromDatabase;
                      // 2. RUN THE STYLE COLORING IMMEDIATELY (No event listener wrapper needed!)
                      const currentStatus = (liveStatus.value || "").trim();
                      // Add clean text design styles
                      liveStatus.style.color = "white";

                      if (currentStatus === "Paid" || currentStatus === "PAID") {
                        liveStatus.style.backgroundColor = "green";
                      } 
                      else if (currentStatus === "Adv.Paid" || currentStatus === "ADV.PAID") {
                        liveStatus.style.backgroundColor = "blue";
                      } 
                      else if (currentStatus === "Pending" || currentStatus === "PENDING") {
                        liveStatus.style.backgroundColor = "red";
                      } 
                      else {
                        // Default fallback styling if empty or unrecognized status
                        liveStatus.style.backgroundColor = "#6c757d"; // standard gray
                      }
              

            // 3. Render the output directly inside your summary text inputs
            const amountInWords = toWordsConfig.convert(grossUnitTotal);
            document.getElementById('edit-taxable-value').value = grossTaxable.toFixed(2);
            document.getElementById('edit-total-vat').value = grossVat.toFixed(2);
            document.getElementById('edit-grand-total').value = grossUnitTotal.toFixed(2);
            document.getElementById('edit-tcost').value = grossUnitCost.toFixed(2);
            document.getElementById('edit-tmargin').value = grossUnitMargin.toFixed(2);
            document.getElementById('edit-amount-in-words').value = amountInWords;
            
            }

            // 🎯 9. HELPER FUNCTION TO RE-INDEX ROWS UPON DELETIONS
                    function recalculateNewInvoiceSerialNumbers() {
                        // const rows = tableBody.querySelectorAll('tr');
                        // rows.forEach((row, index) => {
                        //     const srNoCell = row.querySelector('.row-sr-no');
                        //     if (srNoCell) {
                        //         srNoCell.innerText = index + 1; // Updates sequence cleanly to 1, 2, 3...
                        //     }
                        // });
                        // Grab all rows inside your table body (update selector matching your table's ID)
                      const rows = document.querySelectorAll("#invoice-table tbody tr");                      
                      rows.forEach((row, index) => {
                          // Assuming targetCells[1] holds your "invitems-sr-number" value
                          if (row.cells[1]) {
                              row.cells[1].textContent = index + 1;
                          }
                      });
                    }
//#endregion
//#region     RIGHT CLICK CONTEXT MENU ACTIONS  INVOICES
            
              const contextMenuItems = document.querySelectorAll(".invoices-context-item");
              contextMenuItems.forEach((item) => {
                item.addEventListener("click", (e) => {
                  const actionType = e.currentTarget.getAttribute("data-action");
                  if (actionType) {
                    InvoicesMenuAction(actionType);
                  }
                });
              });              
              function InvoicesMenuAction(actionType) {
                document.getElementById("invoices-context-menu").style.display = "none";

                const targetRow = document.querySelector(".invoices-row-highlight-context",);
                if (!targetRow) return;
                const cells = targetRow.getElementsByTagName("td");
                //EDIT INVOICE DETAILS
                if (actionType === "EDIT") {
                  const cleanInvoiceNoString = String(activeSelectedInvoiceNo).replace(/<[^>]*>/g, "").trim();
                 // console.log("DEBUG: Cleaned InvoiceNo for API fetch:", cleanInvoiceNoString);
                  // 1. 🎯 LOCK THE PARENT SIDEBAR AND GLOBAL WINDOW REFRESH
                  if (window.parent && window.parent.lockSidebarAndRefresh) {
                    window.parent.lockSidebarAndRefresh(true);
                  }
                  // 2. 🎯 LOCK REFRESH KEYS LOCALLY INSIDE THE IFRAME AS WELL
                  window.addEventListener("keydown", localIframeBlockRefresh);

                  // 1. Fire fetch request to extract unified parent/child details arrays
                  fetch(
                    `/api/get-invoice-details?InvoiceNo=${encodeURIComponent(cleanInvoiceNoString)}`,
                  )
                    .then((res) => res.json())
                    .then((payload) => {
                      if (!payload.success) {
                        alert(
                          "Failed to sync invoice ledger details: " +
                            payload.error,
                        );
                        return;
                      }

                      const master = payload.master;
                      const items = payload.items;

                      // 2. Map structural values cleanly onto master text field nodes
                      document.getElementById("edit-modal-title").innerText ="EDIT INVOICE - " + master.Customer + " - " + master.InvoiceNo;
                      document.getElementById("customer").value = master.Customer || "";
                      document.getElementById("edit-postbox").value = master.PostBox || "-";
                      document.getElementById("edit-emirate").value = master.Emirate || "ABU DHABI";
                      document.getElementById("edit-address").value = master.Address || "ABU DHABI, UAE";
                      document.getElementById("edit-vat-no").value = master.VatID || "-";
                      document.getElementById("edit-lpo").value = master.LPONo || "-";
                      if (master.InvoiceDate) {document.getElementById("edit-date").value = master.InvoiceDate.split("T")[0];}
                      document.getElementById("edit-invoice-number").value = master.InvoiceNo;
                      document.getElementById("edit-co-no").value = master.CONo || "-";
                      document.getElementById("edit-payment-terms").value = master.PaymentTerms || "IMMEDIATE";
                      document.getElementById("edit-contact-person").value = master.CustContact || "Mr.";
                      document.getElementById("edit-contact-number").value = master.CustConNumber || "-";
                      document.getElementById("edit-project-name").value = master.ProjectName || "STORE";
                      if (master.DeliveryDate) {document.getElementById("edit-deldate").value = master.DeliveryDate.split("T")[0];}
                      document.getElementById("edit-our-contact").value = master.OurContact || "HABEEB";
                      document.getElementById("edit-our-number").value = master.OurNumber || "054 3893545";
                      document.getElementById("edit-amount-in-words").value = master.InWords;
                      document.getElementById("edit-taxable-value").value = parseFloat(master.SubTotal || 0).toFixed(2);
                      document.getElementById("edit-total-vat").value = parseFloat(master.VatTotal || 0).toFixed(2);
                      document.getElementById("edit-grand-total").value = parseFloat(master.GrandTotal || 0).toFixed(2);
                      document.getElementById("edit-paid-value").value = parseFloat(master.Received || 0).toFixed(2);
                      document.getElementById("edit-balance-value").value = parseFloat(master.Balance || 0).toFixed(2);
                      //document.getElementById("edit-status-value").value = master.Status || "Pending";

                      // 1. First, populate the text field with the string value from your database
                      const statusFromDatabase = master.Status; // Replace with your actual database variable
                      const liveStatus = document.getElementById('edit-status-value');

                      liveStatus.value = statusFromDatabase;
                      // 2. RUN THE STYLE COLORING IMMEDIATELY (No event listener wrapper needed!)
                      const currentStatus = (liveStatus.value || "").trim();
                      // Add clean text design styles
                      liveStatus.style.color = "white";

                      if (currentStatus === "Paid" || currentStatus === "PAID") {
                        liveStatus.style.backgroundColor = "green";
                      } 
                      else if (currentStatus === "Adv.Paid" || currentStatus === "ADV.PAID") {
                        liveStatus.style.backgroundColor = "blue";
                      } 
                      else if (currentStatus === "Pending" || currentStatus === "PENDING") {
                        liveStatus.style.backgroundColor = "red";
                      } 
                      else {
                        // Default fallback styling if empty or unrecognized status
                        liveStatus.style.backgroundColor = "#6c757d"; // standard gray
                      }
                      
                     

                      // 3. Loop child elements and build compact product details grid list rows
                      const itemsBody = document.getElementById("inv-modal-items-rows",);
                      itemsBody.innerHTML = "";

                      if (!items || items.length === 0) {
                        itemsBody.innerHTML =
                          '<tr><td colspan="5" class="text-center text-muted small py-2">No item records attached to this invoice envelope.</td></tr>';
                      } else {
                        items.forEach((item, index) => {
                           const totalCost = parseFloat((item.LiveCost || 0) * (item.Quantity || 0)).toFixed(2);
                           const stockValue = parseFloat((item.LiveCost || 0) * (item.LiveStockCount || 0)).toFixed(2);
                           const subTotal = parseFloat(item.Taxable || 0).toFixed(2);
                           const unitMargin = parseFloat((subTotal || 0) - parseFloat(totalCost || 0)).toFixed(2);
                           
                           
                          const tr = document.createElement("tr");
                          // 2. 💡 CRITICAL FIX: Set your data markers directly onto the element object wrapper!
                      tr.setAttribute('data-id', item.ID || "");
                      tr.setAttribute('data-invno', item.InvoiceNo || "");
                      
                      let rowTextColorStyle = ""; // 🎯 Holder for row inline color styles
                      // 2. 🎨 MAP ROW TEXT COLOR DIRECTLY TO FINANCIAL REGISTRY STATUSES
                      const statusValue = (item.Status ||"Delivered").trim(); // Default to "Delivered" if empty

                      if (statusValue.toLowerCase() === 'partial') {
                        tr.classList.add('invoice-row-partial');
                        tr.style.userSelect = 'none';
                        tr.style.webkitUserSelect = 'none';
                      } else if (statusValue === "Delivered" || statusValue === "DELIVERED") {
                        tr.classList.add("table-success"); 
                         tr.style.userSelect = "none";         // 🚫 Disables selection
                         tr.style.webkitUserSelect = "none";   // Safari support
                        //rowTextColorStyle = "color: blue;"; // green
                      } else if (statusValue === "Credit" || statusValue === "CREDIT") {
                        tr.classList.add("table-danger");
                         tr.style.userSelect = "none";         // 🚫 Disables selection
                         tr.style.webkitUserSelect = "none";   // Safari support
                        //rowTextColorStyle = "color: blue;"; // red
                      } 
                      // 3. Inject the style attribute directly into the opening <tr> element node
                      // if (rowTextColorStyle) {
                      //   tr.setAttribute("style", rowTextColorStyle);
                      // }
                          tr.innerHTML = `
                            
                            <td style="color:blue; font-size:12px; font-weight:600; padding:0px;">${item.ID}</td>
                            <td style="color:blue; font-size:12px; font-weight:600; padding:0px; text-align:center">${item.SrNo}</td>
                            <td style="color:blue; font-size:12px; font-weight:600; padding:0px">${item.Item}</td>
                            <td class="row-qty" style="color:blue; font-size:12px; font-weight:600; padding:0px; text-align:center">${item.Quantity || 0}</td>
                            <td class="row-cn-qty" style="color:blue; font-size:12px; font-weight:600; padding:0px; text-align:center">${String(item.Status || '').trim().toLowerCase() === 'delivered' ? (Number(item.Quantity) || 0) : String(item.Status || '').trim().toLowerCase() === 'partial' ? Math.min(Number(item.Quantity) || 0, Math.max(0, Number(item.CNQty) || 0)) : 0}</td>
                            <td style="color:blue; font-size:12px; font-weight:600; padding:0px">${item.ISize || 0}</td>
                            <td style="color:blue; font-size:12px; font-weight:600; padding:0px">${item.IRAL || 0}</td>
                            <td style="color:blue; font-size:12px; font-weight:600; padding:0px">${item.IUnit || 0}</td>
                            <td style="color:blue; font-size:12px; font-weight:600; padding:0px; text-align:right">${parseFloat(item.UnitPrice || 0).toFixed(2)}</td>
                            <td style="color:blue; font-size:12px; font-weight:600; padding:0px; text-align:right">${parseFloat(item.Discount || 0).toFixed(2)}</td>
                            <td style="color:blue; font-size:12px; font-weight:600; padding:0px; text-align:right">${parseFloat(item.VatPer || 0).toFixed(2)}</td>
                            <td class="row-taxable" style="color:blue; font-size:12px; font-weight:600; padding:0px; text-align:right">${parseFloat(subTotal || 0).toFixed(2)}</td>
                            <td class="row-vattotal" style="color:blue; font-size:12px; font-weight:600; padding:0px; text-align:right">${parseFloat(item.VatTotal || 0).toFixed(2)}</td>
                            <td class="row-unittotal" style="color:blue; font-size:12px; font-weight:600; padding:0px; text-align:right">${parseFloat(item.UnitTotal || 0).toFixed(2)}</td>

                            <td style="color:blue; font-size:12px; font-weight:600; padding:0px">${item.PID || 0}</td>
                            <td style="color:blue; font-size:12px; font-weight:600; padding:0px">${item.LiveStockCount || 0}</td>
                            <td style="color:blue; font-size:12px; font-weight:600; padding:0px; text-align:right">${parseFloat(item.LiveCost || 0).toFixed(2)}</td>
                            <td class="row-unitcost" style="color:blue; font-size:12px; font-weight:600; padding:0px; text-align:right">${parseFloat(totalCost).toFixed(2)}</td> 
                            <td style="color:blue; font-size:12px; font-weight:600; padding:0px; text-align:right">${parseFloat(stockValue).toFixed(2)}</td>
                            <td class="row-unitmargin" style="color:blue; font-size:12px; font-weight:600; padding:0px; text-align:right">${parseFloat(unitMargin).toFixed(2)}</td>
                            <td style="font-size:12px; font-weight:600; padding:0px">${item.Status}</td>
                            <td style="color:blue; font-size:12px; font-weight:600; padding:0px">${item.InvoiceNo}</td>
                        `;
                          itemsBody.appendChild(tr);
                          calculateInvGrandtotal();
                        });
                      }///////

                      // Pop the expanded canvas editor window frame open
                      document.getElementById(
                        "editinv-modal-overlay",
                      ).style.display = "flex";
                    })
                    .catch((err) => {
                      console.error(
                        "Failed to load invoice items mapping: ",
                        err,
                      );
                      alert("Network timeout syncing data values.");
                    });
                    // END EDIT INVOICE
                    // STARTS DO CREATE
                } else if(actionType==="DO"){

                  const cleanInvoiceNoString = String(activeSelectedInvoiceNo).replace(/<[^>]*>/g, "").trim();
                 // console.log("DEBUG: Cleaned InvoiceNo for API fetch:", cleanInvoiceNoString);
                  // 1. 🎯 LOCK THE PARENT SIDEBAR AND GLOBAL WINDOW REFRESH
                  if (window.parent && window.parent.lockSidebarAndRefresh) {
                    window.parent.lockSidebarAndRefresh(true);
                  }
                  // 2. 🎯 LOCK REFRESH KEYS LOCALLY INSIDE THE IFRAME AS WELL
                  window.addEventListener("keydown", localIframeBlockRefresh);

                  // 1. Fire fetch request to extract unified parent/child details arrays
                  fetch(
                    `/api/do-invoice-details?InvoiceNo=${encodeURIComponent(cleanInvoiceNoString)}`,
                  )
                    .then((res) => res.json())
                    .then((payload) => {
                      if (!payload.success) {
                        alert(payload.message,
                          "Failed to sync invoice ledger details: " +
                            payload.error,
                        );
                        return;
                      }

                      const master = payload.master;
                      const items = payload.items;

                      // 2. Map structural values cleanly onto master text field nodes
                      document.getElementById("do-modal-title").innerText ="CREATE DELIVERY NOTE  FOR  INV# " + master.InvoiceNo;
                      document.getElementById("do-customer").value = master.Customer || "";
                      document.getElementById("do-postbox").value = master.PostBox || "-";
                      document.getElementById("do-emirate").value = master.Emirate || "ABU DHABI";
                      document.getElementById("do-address").value = master.Address || "ABU DHABI, UAE";
                      document.getElementById("do-vat-no").value = master.VatID || "-";
                      document.getElementById("do-lpo").value = master.LPONo || "-";
                      {document.getElementById("do-date").value = formattedDate.split("T")[0];}
                      document.getElementById("do-invoice-no").value = master.InvoiceNo;
                      document.getElementById("do-co-no").value = master.CONo || "-";
                      document.getElementById("do-payment-terms").value = master.PaymentTerms || "IMMEDIATE";
                      document.getElementById("do-contact-person").value = master.CustContact || "Mr.";
                      document.getElementById("do-contact-number").value = master.CustConNumber || "-";
                      document.getElementById("do-delivery-place").value = master.ProjectName || "STORE";
                      if (master.DeliveryDate) {document.getElementById("do-deldate").value = master.DeliveryDate.split("T")[0];}
                      document.getElementById("do-our-contact").value = master.OurContact || "HABEEB";
                      document.getElementById("do-our-number").value = master.OurNumber || "054 3893545";
                     

                      
                     

                      // 3. Loop child elements and build compact product details grid list rows
                      const itemsBody = document.getElementById("do-modal-items-rows",);
                      itemsBody.innerHTML = "";

                      if (!items || items.length === 0) {
                        itemsBody.innerHTML =
                          '<tr><td colspan="5" class="text-center text-muted small py-2">No item records attached to this invoice envelope.</td></tr>';
                      } else {
                        items.forEach((item, index) => {
                          //  const totalCost = parseFloat((item.LiveCost || 0) * (item.Quantity || 0)).toFixed(2);
                          //  const stockValue = parseFloat((item.LiveCost || 0) * (item.LiveStockCount || 0)).toFixed(2);
                          //  const subTotal = parseFloat(item.Taxable || 0).toFixed(2);
                          //  const unitMargin = parseFloat((subTotal || 0) - parseFloat(totalCost || 0)).toFixed(2);
                           
                           
                          const tr = document.createElement("tr");
                          // 2. 💡 CRITICAL FIX: Set your data markers directly onto the element object wrapper!
                      tr.setAttribute('data-id', item.ID || "");
                      tr.setAttribute('data-invno', item.InvoiceNo || "");
                      
                      let rowTextColorStyle = ""; // 🎯 Holder for row inline color styles
                      // 2. 🎨 MAP ROW TEXT COLOR DIRECTLY TO FINANCIAL REGISTRY STATUSES
                      const statusValue = (item.Status ||"Delivered").trim(); // Default to "Delivered" if empty

                      // if (statusValue === "Delivered" || statusValue === "DELIVERED") {
                      //   tr.classList.add("table-success"); 
                      //    tr.style.userSelect = "none";         // 🚫 Disables selection
                      //    tr.style.webkitUserSelect = "none";   // Safari support
                      //   //rowTextColorStyle = "color: blue;"; // green
                      if (statusValue === "Credit" || statusValue === "CREDIT") {
                          tr.classList.add("table-primary");}
                      //    tr.style.userSelect = "none";         // 🚫 Disables selection
                      //    tr.style.webkitUserSelect = "none";   // Safari support
                      //   //rowTextColorStyle = "color: blue;"; // red
                      // } 
                      // 3. Inject the style attribute directly into the opening <tr> element node
                      // if (rowTextColorStyle) {
                      //   tr.setAttribute("style", rowTextColorStyle);
                      // }
                          tr.innerHTML = `
                            
                            
                            <td style="color:blue; font-size:12px; font-weight:600; padding:0px; text-align:center">${item.SrNo}</td>
                            <td style="color:blue; font-size:12px; font-weight:600; padding:0px">${item.Item}</td>
                            <td class="row-qty" style="color:blue; font-size:12px; font-weight:600; padding:0px; text-align:center">${item.Quantity || 0}</td>
                            <td style="color:blue; font-size:12px; font-weight:600; padding:0px">${item.ISize || 0}</td>
                            <td style="color:blue; font-size:12px; font-weight:600; padding:0px">${item.IRAL || 0}</td>
                            <td style="color:blue; font-size:12px; font-weight:600; padding:0px">${item.IUnit || 0}</td>
                           
                            
                        `;
                          itemsBody.appendChild(tr);
                          //calculateInvGrandtotal();
                        });
                      }///////

                      // Pop the expanded canvas editor window frame open
                      document.getElementById(
                        "do-modal-overlay",
                      ).style.display = "flex";
                    })
                    .catch((err) => {
                      console.error(
                        "Failed to load invoice items mapping: ",
                        err,
                      );
                      alert("Network timeout syncing data values.");
                    });
                  
                } else if (actionType === "PAY") {

                  // 1. 🎯 LOCK THE PARENT SIDEBAR AND GLOBAL WINDOW REFRESH
                  if (window.parent && window.parent.lockSidebarAndRefresh) {window.parent.lockSidebarAndRefresh(true);}
                  // 2. 🎯 LOCK REFRESH KEYS LOCALLY INSIDE THE IFRAME AS WELL
                  window.addEventListener("keydown", localIframeBlockRefresh);
               
                  const saveBtn = document.getElementById("payment-btn-update");
                  const payAmount = document.getElementById("modal-amount-to-pay");

                  const rawCustomer =
                    cells[4].innerText || cells[4].textContent || "CASH";//Customer

                  const rawTotalText =
                    cells[5].innerText || cells[5].textContent || "0"; //Amount

                  const rawPaidText =
                    cells[6].innerText || cells[6].textContent || "0"; //Paid

                  const rawBalanceText =
                    cells[8].innerText || cells[8].textContent || "0";

                  const rawMode =
                    cells[13].innerText || cells[13].textContent || "Cash";

                  const cleanPaidText = rawPaidText.replace(/[^\d.]/g, "");
                  const cleanTotalAmount = rawTotalText.replace(/[^\d.]/g, "");
                  const cleanCurrentBalance = rawBalanceText.replace(/[^\d.]/g,"",);
                  const currentBalance = parseFloat(cleanCurrentBalance) || 0;
                  // 3. Debug Alert (Remove this after testing): Check exactly what the computer reads
                // console.log("Invoice No:", activeSelectedInvoiceNo, "Parsed Float Balance:", currentBalance);   
                  // Inject clean unformatted values directly into modal fields
                  document.getElementById("modal-title-text").innerText = "PAYMENT - " + activeSelectedInvoiceNo + " - " + rawCustomer;
                  document.getElementById("modal-grand-total").value = parseFloat(cleanTotalAmount).toFixed(2);
                  document.getElementById("modal-current-balance").value = parseFloat(cleanCurrentBalance).toFixed(2);
                  document.getElementById("modal-amount-to-pay").value = parseFloat(cleanCurrentBalance).toFixed(2);
                  document.getElementById("modal-amount-paid").value = parseFloat(cleanPaidText).toFixed(2);

                   

                  document.getElementById("modal-date-input").value = new Date().toISOString().split("T")[0];
                  document.getElementById("modal-mode-select").value = rawMode || "Cash";
                  toggleChequeInput(rawMode);

                  // Display Modal overlay
                  document.getElementById("payment-modal-overlay",).style.display = "flex";

                   if (saveBtn) {
                  // Check if balance is 0, negative, or if the string evaluation fails entirely (NaN)
                  if (isNaN(currentBalance) || currentBalance <= 0) {
                    payAmount.disabled =true;
                    // saveBtn.disabled = true;                        // Native lock
                    // saveBtn.setAttribute("disabled", "disabled");   // Attribute lock
                    // saveBtn.classList.add("disabled");              // Framework class style lock
                    // saveBtn.style.opacity = "0.5";                  // Visual dimmed state fallback
                    // saveBtn.style.pointerEvents = "none";           // Total click isolation fallback
                } else {
                    payAmount.disabled =false;
                    // saveBtn.disabled = false;
                    // saveBtn.removeAttribute("disabled");
                    // saveBtn.classList.remove("disabled");
                    // saveBtn.style.opacity = "1.0";
                    // saveBtn.style.pointerEvents = "auto";
                    
                  }
                }

                  setTimeout(() => {
                    document.getElementById("modal-amount-to-pay").focus();
                  }, 80);
                } else if (actionType === "PRINT") {
                  // Guard clause check to ensure a unique record number is locked down in memory tracking variables
                if (!activeSelectedInvoiceNo) {
                  alert("Error: No valid invoice row selected for generating a report view printout.");
                  return;
                }
                // Using window.location.href automatically acts as a silent execution file generation layer download trigger
                window.location.href = `/api/print-invoice/${encodeURIComponent(activeSelectedInvoiceNo)}`;
                } else if (actionType === "PDC-DUE") {
                  FetchPdcClearModal();
                } else if (actionType === "MULTI-PAY") {
                  FetchMutltiInvoicePayModal();
                } else if(actionType === "RECEIPT" ){

                document.getElementById("receipt-title-text").textContent = "CASH/CHEQUE RECEIPT - " + activeSelectedCustomer;
                document.getElementById("receipt-customer").value = activeSelectedCustomer;
                document.getElementById("receipt-emirate").value = activeSelectedEmirate;
                document.getElementById("receipt-invno").value = activeSelectedInvoiceNo;
                document.getElementById("receipt-invdate").value = activeSelectedInvDate.split("T")[0];
                // document.getElementById("receipt-invdate").value = activeSelectedInvoiceDate;
                document.getElementById("receipt-amount").value = activeSelectedAmount;
                document.getElementById("receipt-inwords").value = activeSelectedInwords;
                {document.getElementById("receipt-date").value = formattedDate.split("T")[0];}
                {document.getElementById("receipt-chqdate").value = formattedDate.split("T")[0];}
                document.getElementById("receipt-id").value = activeSelectedInvoiceId;

                // 1. 🎯 LOCK THE PARENT SIDEBAR AND GLOBAL WINDOW REFRESH
                  if (window.parent && window.parent.lockSidebarAndRefresh) {
                    window.parent.lockSidebarAndRefresh(true);
                  }
                  // 2. 🎯 LOCK REFRESH KEYS LOCALLY INSIDE THE IFRAME AS WELL
                  window.addEventListener("keydown", localIframeBlockRefresh);

                  // Display Modal overlay
                  document.getElementById("receipt-modal-overlay",).style.display = "flex";
                  
                // Clean function utilizing your global context-menu tracking variables directly


                }else if (actionType === "MULTI-RECEIPT") {
                  FetchMutltiInvoiceReceipt();
                }else if (actionType === "STATEMENT") {
                document.getElementById("statement-title-text").textContent = "STATEMENT OF INVOICES - " + activeSelectedCustomer;
                document.getElementById("statement-customer").value = activeSelectedCustomer;
                document.getElementById("statement-emirate").value = activeSelectedEmirate;
                // document.getElementById("statement-to-date").value = formattedDate.split("T")[0];
                // document.getElementById("statement-invdate").value = activeSelectedInvoiceDate;
                {document.getElementById("statement-date").value = formattedDate.split("T")[0];}
                
                  // 1. Reset dropdown to default "Last 3 Months" constraint when opening fresh
                // if (durationSelect) {
                //     durationSelect.value = "3MONTH"; 
                // }

                // 2. Automatically calculate and populate the 'From Date' and 'To Date' pickers
                  updateInvoiceDatePickers();

                // 1. 🎯 LOCK THE PARENT SIDEBAR AND GLOBAL WINDOW REFRESH
                  if (window.parent && window.parent.lockSidebarAndRefresh) {
                    window.parent.lockSidebarAndRefresh(true);
                  }
                  // 2. 🎯 LOCK REFRESH KEYS LOCALLY INSIDE THE IFRAME AS WELL
                  window.addEventListener("keydown", localIframeBlockRefresh);

                  // Display Modal overlay
                  document.getElementById("statement-modal-overlay",).style.display = "flex";
                  
                // Clean function utilizing your global context-menu tracking variables directly

                }


    }//function end
//#endregion
//#endregion=====MAIN INVOICE CODE ENDS===========

//#region  EDIT INVOICE MODAL CODES 📌
//#region     RIGHT AND LEFT CLICK CONTEXT MENU ACTIONS - INVOICE ITEMS ROW 
       
              // ⚡ LEFT-CLICK MULTI-SELECTION LISTENER
            document.getElementById("inv-modal-items-rows").addEventListener("click", function (e) {
              const clickedRow = e.target.closest("tr");
              
              // Exit if clicking outside a row, or if clicking an input text box/button inside the row
              if (!clickedRow || e.target.tagName === "INPUT" || e.target.tagName === "BUTTON") return;
              // 🛑 SAFETY LOCK: If row is a Credit Note, ignore the click completely
              if (!clickedRow || clickedRow.classList.contains('table-danger')) {
                e.preventDefault();
                alert("This row is a Credit Note item and cannot be edited. Please select a valid invoice item row.");
                  return; 
              }

              // 💡 TOGGLE SELECTION ON LEFT-CLICK: Adds/removes orange/blue highlight class
              clickedRow.classList.toggle("row-selected-for-cn");
            });

                //item context submenu click event
              const invItemContext = document.querySelectorAll(".editinvo-context-item");
              invItemContext.forEach((item) => {item.addEventListener("click", (e) => {
              const actionType = e.currentTarget.getAttribute("data-action");
                  if (actionType) {ItemMenuAction(actionType);} }); 
              });

              // item context menu click action
                function ItemMenuAction(actionType) {
                document.getElementById("editinvo-context-menu").style.display ="none";
                const targetRow = document.querySelector(".editinvo-row-highlight-context",);
                
                if (!targetRow) return;
                const cells = targetRow.getElementsByTagName("td");
                 // 1. 🎯 LOCK THE PARENT SIDEBAR AND GLOBAL WINDOW REFRESH
                  if (window.parent && window.parent.lockSidebarAndRefresh) {
                    window.parent.lockSidebarAndRefresh(true);
                  }
                  // 2. 🎯 LOCK REFRESH KEYS LOCALLY INSIDE THE IFRAME AS WELL
                  window.addEventListener("keydown", localIframeBlockRefresh);

                  if (actionType === "EDIT") {
                    // 🎯 SAVE THE ROW ELEMENT REFERENCE (Assuming 'row' or 'cells[0].parentElement' is the <tr>)
                  activeEditingRow = cells[0].parentElement; 


                  // 1. 🎯 LOCK THE PARENT SIDEBAR AND GLOBAL WINDOW REFRESH
                  if (window.parent && window.parent.lockSidebarAndRefresh) {
                    window.parent.lockSidebarAndRefresh(true);
                  }
                  // 2. 🎯 LOCK REFRESH KEYS LOCALLY INSIDE THE IFRAME AS WELL
                  window.addEventListener("keydown", localIframeBlockRefresh);
                
                  //collect data from table to display text fields
                  const SelectedSr =  cells[1].innerText.trim() || cells[1].textContent.trim();
                  const SelectedProduct =  cells[2].innerText.trim() || cells[2].textContent.trim();
                  const SelectedQty =  cells[3].innerText.trim() || cells[3].textContent.trim();
                  const SelectedSize =  cells[5].innerText.trim() || cells[5].textContent.trim();

                  const SelectedRal =  cells[6].innerText.trim() || cells[6].textContent.trim();
                  const SelectedUnit =  cells[7].innerText.trim() || cells[7].textContent.trim();
                  const SelectedUnitPrice =  cells[8].innerText.trim() || cells[8].textContent.trim();
                  const SelectedDiscper =  cells[9].innerText.trim() || cells[9].textContent.trim();

                  const SelectedVatper =  cells[10].innerText.trim() || cells[10].textContent.trim();
                  const SelectedTaxable =  cells[11].innerText.trim() || cells[11].textContent.trim();
                  const SelectedVattotal =  cells[12].innerText.trim() || cells[12].textContent.trim();
                  const SelectedUnittotal =  cells[13].innerText.trim() || cells[13].textContent.trim();

                  const SelectedPid =  cells[14].innerText.trim() || cells[14].textContent.trim();
                  const SelectedStock =  cells[15].innerText.trim() || cells[15].textContent.trim();
                  const SelectedIcost =  cells[16].innerText.trim() || cells[16].textContent.trim();
                  const SelectedUcost =  cells[17].innerText.trim() || cells[17].textContent.trim();
                  const SelectedSvalue =  cells[18].innerText.trim() || cells[18].textContent.trim();
                  const SelectedUmargin =  cells[19].innerText.trim() || cells[19].textContent.trim();
                  // Inject clean unformatted values directly into modal fields
                  document.getElementById("invitems-title-text").innerText = window.matchMedia("(max-width: 767px)").matches ? "Edit Row - Sr No- " + SelectedSr : "EDIT INVOICE ITEMS RAW - Sr No: " + SelectedSr;
                  document.getElementById("invitems-sr-number").value = SelectedSr ;
                  document.getElementById("invitems-product").value = SelectedProduct ;
                  document.getElementById("invitems-qty").value = SelectedQty ;
                  document.getElementById("invitems-i-size").value = SelectedSize ;

                  document.getElementById("invitems-i-ral").value = SelectedRal ;
                  document.getElementById("invitems-i-unit").value = SelectedUnit ;
                  document.getElementById("invitems-unit-price").value = parseFloat(SelectedUnitPrice).toFixed(2) ;
                  document.getElementById("invitems-disc-per").value = parseFloat(SelectedDiscper).toFixed(2) ;

                  document.getElementById("invitems-vat-per").value = parseFloat(SelectedVatper).toFixed(2) ;
                  document.getElementById("invitems-taxable").value = parseFloat(SelectedTaxable).toFixed(2) ;
                  document.getElementById("invitems-vat-total").value = parseFloat(SelectedVattotal).toFixed(2) ;
                  document.getElementById("invitems-unit-total").value = parseFloat(SelectedUnittotal).toFixed(2) ;

                  document.getElementById("invitems-pid").value = SelectedPid ;
                  document.getElementById("invitems-o-stock").value = Number(SelectedStock) + Number(SelectedQty) ;
                  document.getElementById("invitems-a-stock").value = SelectedStock ;
                  document.getElementById("invitems-i-cost").value = parseFloat(SelectedIcost).toFixed(2) ;
                  document.getElementById("invitems-u-cost").value = parseFloat(SelectedUcost).toFixed(2) ;
                  document.getElementById("invitems-s-value").value = parseFloat(SelectedSvalue).toFixed(2) ;
                  document.getElementById("invitems-u-margin").value =parseFloat( SelectedUmargin).toFixed(2) ;

                  // Display Modal overlay
                  document.getElementById("invitems-modal-overlay",).style.display = "flex";
                }           //action type EDIT ends here
                 else if (actionType === "DELETE") {
                // 1. 🎯 Find the row element safely (supports both arrays and raw elements)
                const targetElement = cells[0] || cells; 
                const rowToDelete = targetElement.closest ? targetElement.closest("tr") : cells.parentElement;

                const SelectedProduct =  cells[2].innerText.trim() || cells[2].textContent.trim();
                const SelectedQty =  cells[3].innerText.trim() || cells[3].textContent.trim();
                
                const SelectedStock =  cells[15].innerText.trim() || cells[15].textContent.trim();
                const SelectedIcost =  cells[16].innerText.trim() || cells[16].textContent.trim();
                const SelectedPid =  cells[14].innerText.trim() || cells[14].textContent.trim();
                const realStock = parseFloat(SelectedQty) + parseFloat(SelectedStock);
                const realValue = realStock * parseFloat(SelectedIcost);

                const invoiceDeleted = {
                  SelectedPid,
                  realStock,
                  realValue,
                  SelectedIcost
                }
                

                // 2. Safety check: make sure we actually found a <tr> row element
                if (!rowToDelete) {
                    console.error("Could not locate the table row element to delete.");
                    return;
                }
                // 2. Prompt the user with a clean confirmation dialog
                if (confirm(`Delete this Row ?, Item: ${SelectedProduct} - ID: ${SelectedPid}  - Stock: ${realStock} - Stock Value: ${realValue}...  Delete this Row will Update the Invoice and Stock, Can not Undo this Action !`)) {
                    
                    // 3. Remove the row from the HTML table structure
                    rowToDelete.remove();
                    //UPDATE INVOICE AND STOCK
                    
                    calculateInvGrandtotal();
                    recalculateNewInvoiceSerialNumbers(); 
                    updateInvoice();
                }
                 //UPDATE INVOICE AND STOCK
    async function updateInvoice(){
          

    // 1. 📋 Gather data for the 'invoicemain' master table
    const invoiceMainData = {
        invoiceNo: parseInt(document.getElementById("edit-invoice-number")?.value),
        customer: document.getElementById("customer")?.value,
        postbox: document.getElementById("edit-postbox")?.value || "-",
        emirate: document.getElementById("edit-emirate")?.value,
        address: document.getElementById("edit-address")?.value,
        vatID: document.getElementById("edit-vat-no")?.value || "-",
        invoiceDate: document.getElementById("edit-date")?.value,
        lpoNo: document.getElementById("edit-lpo")?.value || "-",
        coNo: document.getElementById("edit-co-no")?.value || "-",
        paymentTerms: document.getElementById("edit-payment-terms")?.value || "IMMEDIATE",
        contactPerson: document.getElementById("edit-contact-person")?.value || "Mr.",
        contactNumber: document.getElementById("edit-contact-number")?.value || "N/A",
        projectName: document.getElementById("edit-project-name")?.value || "STORE",
        deliveryDate: document.getElementById("edit-deldate")?.value,
        ourContact: document.getElementById("edit-our-contact")?.value || "HABEEB RAHMAN",
        ourNumber: document.getElementById("edit-our-number")?.value || "054 3893545",
        notes: document.getElementById("edit-notes")?.value || "N/A",

        invCost: parseFloat(document.getElementById("edit-tcost")?.value || 0),
        invMargin: parseFloat(document.getElementById("edit-tmargin")?.value || 0),
        subTotal: parseFloat(document.getElementById("edit-taxable-value")?.value || 0),
        vatTotal: parseFloat(document.getElementById("edit-total-vat")?.value || 0),
        grandTotal: parseFloat(document.getElementById("edit-grand-total")?.value || 0),
        Received: parseFloat(document.getElementById("edit-paid-value")?.value || 0),
        Balance: parseFloat(document.getElementById("edit-balance-value")?.value || 0),
        Status: document.getElementById("edit-status-value")?.value || "Pnding",
        inWords: document.getElementById("edit-amount-in-words")?.value || "AED:",
    };

    // 2. 📋 Gather item rows for the 'invoices' details table
    const invoiceItemsData = [];
    const rows = document.querySelectorAll("#invoice-table tbody tr"); // Update with your actual table ID

    rows.forEach((row) => {
        const cells = row.cells;
        // Make sure it's a valid data row and not an empty placeholder
        if (cells && cells.length > 0) {
            invoiceItemsData.push({
                sr_no: cells[1].textContent.trim(),
                item: cells[2].textContent.trim(),
                qty: parseInt(cells[3].textContent.trim(), 10) || 1,
                isize: cells[5].textContent.trim(),
                iral: cells[6].textContent.trim(),
                iunit: cells[7].textContent.trim(),
                unitprice: parseFloat(cells[8].textContent.trim()) || 0,
                discper: parseFloat(cells[9].textContent.trim()) || 0,
                vatper: parseFloat(cells[10].textContent.trim()) || 0,
                taxable: parseFloat(cells[11].textContent.trim()) || 0,
                vattotal: parseFloat(cells[12].textContent.trim()) || 0,
                unittotal: parseFloat(cells[13].textContent.trim()) || 0,
                pid: cells[14].textContent.trim(),//1
                astock: parseInt(cells[15].textContent.trim()),//2
                icost: parseFloat(cells[16].textContent.trim()) || 0,//3
                ucost: parseFloat(cells[17].textContent.trim()) || 0,
                svalue: parseFloat(cells[18].textContent.trim()) || 0,//4
                umargin: parseFloat(cells[19].textContent.trim()) || 0,
                status: cells[20].textContent.trim() || "Delivered",
                // status: "Delivered",
                invoiceNo: parseInt(document.getElementById("edit-invoice-number")?.value),
            });
        }
    });
          // 3. 🛡️ Quick validation: Ensure there is at least one item to save
          if (invoiceItemsData.length === 0) {
              alert("Cannot save an empty invoice. Please add items first.");
              return;
          }
          // 4. 🚀 Package everything into a payload object
          const payload = {
              main: invoiceMainData,
              items: invoiceItemsData,
              deletedItem: invoiceDeleted
          };

          // 5. 📨 Send payload via AJAX Fetch API to your server backend
          try {
              const response = await fetch("/api/update-invoice", { // Update to your API file path (e.g., .php, .asp, /api/invoice)
                  method: "POST",
                  headers: {
                      "Content-Type": "application/json"
                  },
                  body: JSON.stringify(payload)
              });

              const result = await response.json();

              if (result.success) {
                  alert("Invoice - " + invoiceMainData.invoiceNo +   " - and Stock Successfully Updated in Database!");
                  
                  // Unlock page mechanisms and close main modal here
                  // window.removeEventListener("keydown", localIframeBlockRefresh);
                  // if (window.parent && window.parent.lockSidebarAndRefresh) {
                  //     window.parent.lockSidebarAndRefresh(false);
                  // }
                  // document.getElementById("editinv-modal-overlay").style.display = "none";
                  fetchFilteredInvoices();
              } else {
                  alert("Database Error: " + result.message);
              }
               } catch (error) {
              console.error("Transmission Error:", error);
              alert("Failed to connect to the server database endpoint.");
              }
                    }//fuction ends
                }//Delete end

                else if (actionType === "CREDIT") {

                  // 1. Gather all manually selected rows
                  let selectedRows = document.querySelectorAll("#inv-modal-items-rows tr.row-selected-for-cn");
                  // 2. Intelligent Fallback: If no rows are multi-selected, default exclusively to the right-clicked row
                  if (selectedRows.length === 0) {
                    selectedRows = [targetRow];
                  }
                  // Only remaining Delivered/Partial quantities can be credited.
                  selectedRows = Array.from(selectedRows).filter(row => {
                    const status = String(row.cells[20]?.textContent || '').trim().toLowerCase();
                    return ['delivered', 'partial'].includes(status) && Number(row.cells[4]?.textContent) > 0;
                  });
                  if (!selectedRows.length) { alert('No remaining quantity is available for a credit note.'); return; }
                  // 3. Clear target secondary Credit Note items body row stack
                  const cnTableBody = document.getElementById("credit-note-modal-items-rows");
                  if (cnTableBody) {
                    cnTableBody.innerHTML = '';
                    cnTableBody.dataset.requestId = window.crypto?.randomUUID?.() || (Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
                  }

                  // 4. Fetch the top input values from your parent invoice layout form
                  const currentCustomer = document.getElementById("customer")?.value || "CASH";
                  const currentPostBox = document.getElementById("edit-postbox")?.value || "-";
                  const currentEmirate = document.getElementById("edit-emirate")?.value || "ABU DHABI";
                  const currentAddress = document.getElementById("edit-address")?.value || "ABU DHABI";
                  const currentVatID = document.getElementById("edit-vat-no")?.value || "-";
                  const currentLPONo = document.getElementById("edit-lpo")?.value || "-";
                  const currentCONo = document.getElementById("edit-co-no")?.value || "-";
                  const currentInvoiceNo = activeSelectedInvoiceNo || "N/A";
                  const currentInvoiceDate = document.getElementById("edit-date")?.value;
                  const currentNotes = document.getElementById("edit-notes")?.value || "-";
                  
                  //const currentInvoiceNo = activeSelectedInvoiceNo || "N/A";
                  // 5. Populate your top form display targets in your secondary Credit Note modal layout
                  document.getElementById("credit-customer").value = currentCustomer;
                  document.getElementById("credit-postbox").value = currentPostBox;
                  document.getElementById("credit-emirate").value = currentEmirate;
                  document.getElementById("credit-address").value = currentAddress;
                  document.getElementById("credit-vat-no").value = currentVatID;
                  document.getElementById("credit-lpo").value = currentLPONo;
                  document.getElementById("credit-co-no").value = currentCONo;
                  document.getElementById("credit-invoice-no").value = currentInvoiceNo;
                  document.getElementById("credit-invoice-date").value = currentInvoiceDate;
                  document.getElementById("credit-notes").value = currentNotes;
                  // const cnCustomerTarget = document.getElementById("credit-customer");
                  // const cnInvoiceTarget = document.getElementById("credit-invoice-number");
                 // if (cnCustomerTarget) cnCustomerTarget.value = currentCustomer;
                 // if (cnInvoiceTarget) cnInvoiceTarget.value = currentInvoiceNo;
                  document.getElementById("credit-modal-title").innerText = "NEW CREDIT NOTE - FROM INVOICE No: " + currentInvoiceNo;
                  // 6. Loop through all tracked rows and clone their index item fields into the CN table layout
                  selectedRows.forEach((row, idx) => {
                  const rowCells = row.getElementsByTagName("td");
                  const itemID = rowCells[0].innerText.trim() || rowCells[0].textContent.trim();
                  const itemProduct = rowCells[2].innerText.trim() || rowCells[2].textContent.trim();
                  const itemQty = Number(rowCells[4].textContent.trim()) || 0;                  
                  const itemPrice   = rowCells[8].innerText.trim() || rowCells[8].textContent.trim();
                  const itemDiscPer  = rowCells[9].innerText.trim() || rowCells[9].textContent.trim();
                  const itemVatPer  = rowCells[10].innerText.trim() || rowCells[10].textContent.trim();
                  const itemTaxable = (itemQty * Number(itemPrice) * (1 - Number(itemDiscPer) / 100)).toFixed(2);
                  const itemVatAmt = (Number(itemTaxable) * Number(itemVatPer) / 100).toFixed(2);
                  const itemTotal = (Number(itemTaxable) + Number(itemVatAmt)).toFixed(2);
                  const itemPid     = rowCells[14].innerText.trim() || rowCells[14].textContent.trim();
                  const itemStock     = rowCells[15].innerText.trim() || rowCells[15].textContent.trim();
                  const itemCost    = rowCells[16].innerText.trim() || rowCells[16].textContent.trim();
                  const itemUcost = (Number(itemCost) * itemQty).toFixed(2);
                  const itemSvalue     = rowCells[18].innerText.trim() || rowCells[18].textContent.trim();

                  const realStock = parseFloat(itemStock) + parseFloat (itemQty);
                  const realSvalue = realStock * parseFloat(itemCost);
                  
                   // Build out the dynamic rows replica array stack inside the secondary table framework body
                  if (cnTableBody) {
                    const cnNewRow = document.createElement("tr");
                    cnNewRow.dataset.maxCreditQuantity = String(itemQty);
                    cnNewRow.dataset.openStock = String(itemStock);
                    cnNewRow.dataset.invoiceSrNo = rowCells[1].textContent.trim();
                    cnNewRow.innerHTML = `
                      <td style="color:black; font-size:12px; display:none;">${itemID}</td>
                      <td style="color:black; font-size:12px; font-weight:600; text-align:center;">${idx + 1}</td>
                      <td style="color:black; font-size:12px;">${itemProduct}</td>
                      <td class="credit-row-qty" style="color:black; font-size:12px; text-align:center;">${rowCells[3].textContent.trim()}</td>
                      <td><input type="number" class="credit-cn-qty form-control form-control-sm" min="0" max="${itemQty}" step="1" value="${itemQty}" aria-label="CN Qty for item ${idx + 1}"></td>
                      <td style="font-size:12px; text-align:right; padding:2px;">${parseFloat(itemPrice).toFixed(2)}</td>
                      <td style="font-size:12px; text-align:right; padding:2px;">${parseFloat(itemDiscPer).toFixed(2)}</td>
                      <td style="font-size:12px; text-align:right; padding:2px;">${parseFloat(itemVatPer).toFixed(2)}</td>
                      <td class="credit-row-taxable" style="font-size:12px; text-align:right; padding:2px;">${parseFloat(itemTaxable).toFixed(2)}</td>
                      <td class="credit-row-vattotal" style="font-size:12px; text-align:right; padding:2px;">${parseFloat(itemVatAmt).toFixed(2)}</td>
                      <td class="credit-row-unittotal" style="font-size:12px; text-align:right; padding:2px;">${parseFloat(itemTotal).toFixed(2)}</td>
                      <td style="color:black; font-size:12px; text-align:center;">${itemPid}</td>
                      <td style="color:black; font-size:12px; text-align:center;">${realStock}</td>

                      <td style="font-size:12px; text-align:right; padding:2px;">${parseFloat(itemCost).toFixed(2)}</td>
                      <td style="font-size:12px; text-align:right; padding:2px;">${parseFloat(itemUcost).toFixed(2)}</td>
                      <td style="font-size:12px; text-align:right; padding:2px;">${parseFloat(realSvalue).toFixed(2)}</td>
                    `;
                    cnTableBody.appendChild(cnNewRow);
                    cnNewRow.querySelector('.credit-cn-qty').addEventListener('input', () => recalculateCreditRow(cnNewRow));
                    recalculateCreditRow(cnNewRow);
                        }
                       // console.log(`${itemProduct}`);
                    });
                    
                    // 7. Pop open the secondary Credit Note modal layout overlay panel frame link
                    const editModal = document.getElementById("editinv-modal-overlay");
                    const cnOverlay = document.getElementById("credit-note-modal-overlay");
                    if (cnOverlay) {
                      cnOverlay.style.display = "flex";
                      editModal.style.display = "none"; // Hide the edit modal if it was open
                      calculateCreditGrandtotal();
                      recalculateNewCreditSerialNumbers();
                    } else {
                      alert(`Credit Note generated successfully for ${selectedRows.length} item(s), but the secondary modal overlay could not be located.`);
                    }
                  }
                }

                  
             
//#endregion
//#region     ITEMS MODAL CALCULATE UNIT TOTAL
                        // Get references to all elements
              const unitprice = document.getElementById('invitems-unit-price');
              const qty = document.getElementById('invitems-qty');
              const discper = document.getElementById('invitems-disc-per');
              const vatper = document.getElementById('invitems-vat-per');
              const taxable = document.getElementById('invitems-taxable');
              const unitvat = document.getElementById('invitems-vat-total');
              const unittotal = document.getElementById('invitems-unit-total');

              const icost = document.getElementById('invitems-i-cost');
              const discamt = document.getElementById('invitems-disc-amt');
              const ucost = document.getElementById('invitems-u-cost');
              const umargin = document.getElementById('invitems-u-margin');
              const svalue = document.getElementById('invitems-s-value');
              // const tcost = document.getElementById('t-cost');
              // const tmargin = document.getElementById('t-margin');
              const ostock = document.getElementById('invitems-o-stock');
              const astock = document.getElementById('invitems-a-stock');

              // const subtotal = document.getElementById('taxable-value');
              // const totalvat = document.getElementById('total-vat');
              // const grandtotal = document.getElementById('grand-total');
              // const inwords = document.getElementById('amount-in-words');

                // Function to calculate percentage-based totals
              function calculateItemModalTotal() {
                // Convert text values to numbers (fallback safely if fields are empty)
                const invUprice = parseFloat(unitprice.value) || 0;     // UnitPrice value
                const invUquantity = parseFloat(qty.value) || 0;        // Qty value
                const invUdiscountPct = parseFloat(discper.value) || 0; // Discount percentage
                const invUvatPct = parseFloat(vatper.value) || 0;       // Vat percentage
                const invItemcost = parseFloat(icost.value) || 0;   // Item cost
                const invStock = parseFloat(ostock.value) || 0;   // Item cost
                // 1. Apply the percentage discount to the initial price
                const invUdiscountFactor = 1 - (invUdiscountPct / 100);// discount factor
                const invUnetPrice = invUprice * invUdiscountFactor; // Actual Sale price
                const invUdiscAmount = invUprice * invUdiscountPct / 100;// Discount amount
                const invUcost = invItemcost * invUquantity ;// Unit cost amount
                const Utotalinv = invUnetPrice * invUquantity;   // taxable amount
                const invUmargin = Utotalinv - invUcost ;// Invoice Margin amount        
                const invAstock = invStock - invUquantity ;// Available Stock
                const invSvalue = invItemcost * invAstock ;// Invoice Stock Value amount

                // 3. Calculate variable VAT amount and add it to the subtotal
                const vatUFactor = 1 + (invUvatPct / 100); // vat factor
                const Uinvtotal = Utotalinv * vatUFactor; // unit total
                const Uvat = Utotalinv * invUvatPct / 100; // unit vat amount

                // 4. Output the result formatted to 2 decimal places
                taxable.value = Utotalinv.toFixed(2); // display taxable
                unitvat.value = Uvat.toFixed(2); // display unit vat
                unittotal.value = Uinvtotal.toFixed(2);// display unit total
                discamt.value = invUdiscAmount.toFixed(2);// display discount amount
                ucost.value = invUcost.toFixed(2);// display Unit cost invMargin
                umargin.value = invUmargin.toFixed(2);// display invMargin
        
                if (invSvalue <= 0) {
                  svalue.value = "0.00";// if zero
                }else{
                svalue.value = invSvalue.toFixed(2);// display S Value
                }
                if (invAstock <= 0) {
                  astock.value = "0";// if zero
                }else{
                  astock.value = invAstock;// display Stock
                }
                
              }

            // Attach event listeners to all 4 input fields
      unitprice.addEventListener('input', calculateItemModalTotal);
      qty.addEventListener('input', calculateItemModalTotal);
      discper.addEventListener('input', calculateItemModalTotal);
      vatper.addEventListener('input', calculateItemModalTotal);
//#endregion  
//#region     UPDATE INVOICE API BY UPDATE BUTTON

    document.getElementById("btn-update-invoice").addEventListener("click", async function(e) {

    async function updateInvoice(){
            e.preventDefault();
            e.stopPropagation();

    // 1. 📋 Gather data for the 'invoicemain' master table
    const invoiceMainData = {
        invoiceNo: parseInt(document.getElementById("edit-invoice-number")?.value),
        customer: document.getElementById("customer")?.value,
        postbox: document.getElementById("edit-postbox")?.value || "-",
        emirate: document.getElementById("edit-emirate")?.value,
        address: document.getElementById("edit-address")?.value,
        vatID: document.getElementById("edit-vat-no")?.value || "-",
        invoiceDate: document.getElementById("edit-date")?.value,
        lpoNo: document.getElementById("edit-lpo")?.value || "-",
        coNo: document.getElementById("edit-co-no")?.value || "-",
        paymentTerms: document.getElementById("edit-payment-terms")?.value || "IMMEDIATE",
        contactPerson: document.getElementById("edit-contact-person")?.value || "Mr.",
        contactNumber: document.getElementById("edit-contact-number")?.value || "N/A",
        projectName: document.getElementById("edit-project-name")?.value || "STORE",
        deliveryDate: document.getElementById("edit-deldate")?.value,
        ourContact: document.getElementById("edit-our-contact")?.value || "HABEEB RAHMAN",
        ourNumber: document.getElementById("edit-our-number")?.value || "054 3893545",
        notes: document.getElementById("edit-notes")?.value || "N/A",

        invCost: parseFloat(document.getElementById("edit-tcost")?.value || 0),
        invMargin: parseFloat(document.getElementById("edit-tmargin")?.value || 0),
        subTotal: parseFloat(document.getElementById("edit-taxable-value")?.value || 0),
        vatTotal: parseFloat(document.getElementById("edit-total-vat")?.value || 0),
        grandTotal: parseFloat(document.getElementById("edit-grand-total")?.value || 0),
        Received: parseFloat(document.getElementById("edit-paid-value")?.value || 0),
        Balance: parseFloat(document.getElementById("edit-balance-value")?.value || 0),
        Status: document.getElementById("edit-status-value")?.value || "Pnding",
        inWords: document.getElementById("edit-amount-in-words")?.value || "AED:",
    };

    // 2. 📋 Gather item rows for the 'invoices' details table
    const invoiceItemsData = [];
    const rows = document.querySelectorAll("#invoice-table tbody tr"); // Update with your actual table ID

    rows.forEach((row) => {
        const cells = row.cells;
        // Make sure it's a valid data row and not an empty placeholder
        if (cells && cells.length > 0) {
            invoiceItemsData.push({
                sr_no: cells[1].textContent.trim(),
                item: cells[2].textContent.trim(),
                qty: parseInt(cells[3].textContent.trim(), 10) || 1,
                isize: cells[5].textContent.trim(),
                iral: cells[6].textContent.trim(),
                iunit: cells[7].textContent.trim(),
                unitprice: parseFloat(cells[8].textContent.trim()) || 0,
                discper: parseFloat(cells[9].textContent.trim()) || 0,
                vatper: parseFloat(cells[10].textContent.trim()) || 0,
                taxable: parseFloat(cells[11].textContent.trim()) || 0,
                vattotal: parseFloat(cells[12].textContent.trim()) || 0,
                unittotal: parseFloat(cells[13].textContent.trim()) || 0,
                pid: cells[14].textContent.trim(),//1
                astock: parseInt(cells[15].textContent.trim()),//2
                icost: parseFloat(cells[16].textContent.trim()) || 0,//3
                ucost: parseFloat(cells[17].textContent.trim()) || 0,
                svalue: parseFloat(cells[18].textContent.trim()) || 0,//4
                umargin: parseFloat(cells[19].textContent.trim()) || 0,
                status: cells[20].textContent.trim() || "Delivered",
                // status: "Delivered",
                invoiceNo: parseInt(document.getElementById("edit-invoice-number")?.value),
            });
        }
    });

          // 3. 🛡️ Quick validation: Ensure there is at least one item to save
          if (invoiceItemsData.length === 0) {
              alert("Cannot save an empty invoice. Please add items first.");
              return;
          }

          // 4. 🚀 Package everything into a payload object
          const payload = {
              main: invoiceMainData,
              items: invoiceItemsData
          };

    // 5. 📨 Send payload via AJAX Fetch API to your server backend
          try {
              const response = await fetch("/api/update-invoice", { // Update to your API file path (e.g., .php, .asp, /api/invoice)
                  method: "POST",
                  headers: {
                      "Content-Type": "application/json"
                  },
                  body: JSON.stringify(payload)
              });

              const result = await response.json();

              if (result.success) {
                  alert("Invoice - " + invoiceMainData.invoiceNo +   " - and Stock Successfully Updated in Database!");
                  
                  // Unlock page mechanisms and close main modal here
                  window.removeEventListener("keydown", localIframeBlockRefresh);
                  if (window.parent && window.parent.lockSidebarAndRefresh) {
                      window.parent.lockSidebarAndRefresh(false);
                  }
                  document.getElementById("editinv-modal-overlay").style.display = "none";
                  fetchFilteredInvoices();
              } else {
                  alert("Database Error: " + result.message);
              }
          } catch (error) {
              console.error("Transmission Error:", error);
              alert("Failed to connect to the server database endpoint.");
          }
      }//fuction ends

      updateInvoice();
          });

//#endregion
//#region     ADD TO TABLE BY CLICK ADD BUTTON  =======================//
                const tableBody = document.getElementById("inv-modal-items-rows");
                const btnadd = document.getElementById("btn-add");
                const item = document.getElementById("edit-products");
                const quantity = document.getElementById("edit-qty");
                const itemcode = document.getElementById("edit-item-code");

                const isize = document.getElementById("edit-size");
                const iral = document.getElementById("edit-ral");
                const iunit = document.getElementById("edit-unit");
                const uprice = document.getElementById("edit-unit-price");

                const udiscper = document.getElementById("edit-discount");
                const uvatper = document.getElementById("edit-vat");
                const utaxable = document.getElementById("edit-taxable");
                const vattotal = document.getElementById("edit-vat-total");
                const utotal = document.getElementById("edit-unit-total");
                const id = document.getElementById("edit-pid");
                const stock = document.getElementById("edit-a-stock");
                const openstock = document.getElementById("edit-o-stock");

                const Icost = document.getElementById("edit-icost");
                const Ucost = document.getElementById("edit-ucost");
                const Svalue = document.getElementById("edit-unit-svalue");
                const Umargin = document.getElementById("edit-umargin");
                //const status = "Delivered";

                // Listen for button click
                    btnadd.addEventListener('click', function() {
                    // 1. Get current values from text fields
                    const invid = "0";
                    const itemrow = item.value.trim();
                    const qtyrow = quantity.value.trim();
                    const isizerow = isize.value.trim();
                    const iralrow = iral.value.trim();
                    const iunitrow = iunit.value.trim();
                    const upricerow = uprice.value.trim();

                    const udiscperrow = udiscper.value.trim();
                    const uvatperrow = uvatper.value.trim();
                    const utaxablerow = utaxable.value.trim();
                    const vattotalrow = vattotal.value.trim();
                    const utotalrow = utotal.value.trim();
                    const idrow = id.value.trim();
                    const stockrow = stock.value.trim();
                    const icostrow = Icost.value.trim();
                    const Ucostrow = Ucost.value.trim();
                    const Svaluerow = Svalue.value.trim();
                    const Umarginrow = Umargin.value.trim();
                    const statusrow = "Delivered";
                    const Invnorow = "0";

                    // 2. Validation: Prevent adding empty rows
                    if (itemrow === '' || qtyrow === '') {
                        alert('Please fill out both fields.');
                        return;
                    }

                    // --- 1. CHECK FOR DUPLICATES BEFORE ADDING ---
                // Get all the hidden first columns (where invid is stored)
                const existingRows = tableBody.querySelectorAll('tr');
                let isDuplicate = false;

                for (let row of existingRows) {
                    // Get the text inside the first hidden td cell
                    const existingPId = row.cells[14].textContent.trim();
                    
                    // Check if it matches the current item ID you are trying to add
                    if (existingPId === String(idrow)) {
                        isDuplicate = true;
                        break;
                    }
                }
                // If it's a duplicate, alert the user and exit the function
                if (isDuplicate) {
                    alert("This item has already been added to the list!");
                    return; // Stops the execution so no new row is created
                }

                     // 🎯 3. CALCULATE NEXT SERIAL NUMBER
                    // Counts how many rows are currently in the table body, then adds 1
                    const nextSrNo = tableBody.querySelectorAll('tr').length + 1;

                    // 3. Create a new table row element
                    const newRow = document.createElement('tr');
                         newRow.classList.add("table-success"); 
                         newRow.style.userSelect = "none"; 
                    // 4. Insert cell data into the row
                    newRow.innerHTML = `
                        <td style="color:blue; font-size:12px; font-weight:600; padding:0px; display: none;">${invid}</td>
                        <td style="color:blue; font-size:12px; font-weight:600; padding:0px; text-align:center">${nextSrNo}</td>
                        <td style="color:blue; font-size:12px; font-weight:600; padding:0px">${itemrow}</td>
                        <td class="row-qty" style="color:blue; font-size:12px; font-weight:600; padding:0px; text-align:center">${qtyrow}</td>
                        <td class="row-cn-qty" style="text-align:center">${qtyrow}</td>
                        <td style="color:blue; font-size:12px; font-weight:600;  padding:0px">${isizerow || "-"}</td>
                        <td style="color:blue; font-size:12px; font-weight:600;  padding:0px">${iralrow || "-"}</td>
                        <td style="color:blue; font-size:12px; font-weight:600;  padding:0px">${iunitrow || "-"}</td>
                        <td style="color:blue; font-size:12px; font-weight:600;  padding:0px; text-align:right">${parseFloat(upricerow).toFixed(2)}</td>

                        <td style="color:blue; font-size:12px; font-weight:600;  padding:0px; text-align:right">${parseFloat(udiscperrow).toFixed(2)}</td>
                        <td style="color:blue; font-size:12px; font-weight:600;  padding:0px; text-align:right">${parseFloat(uvatperrow).toFixed(2)}</td>
                        <td class="row-taxable" style="color:blue; font-size:12px; font-weight:600;  padding:0px; text-align:right">${parseFloat(utaxablerow).toFixed(2)}</td>
                        <td class="row-vattotal" style="color:blue; font-size:12px; font-weight:600;  padding:0px; text-align:right">${parseFloat(vattotalrow).toFixed(2)}</td>
                        <td class="row-unittotal" style="color:blue; font-size:12px; font-weight:600;  padding:0px; text-align:right">${parseFloat(utotalrow).toFixed(2)}</td>
                        <td style="color:blue; font-size:12px; font-weight:600;  padding:0px">${idrow}</td>
                        <td style="color:blue; font-size:12px; font-weight:600;  padding:0px">${stockrow}</td>

                        <td style="color:blue; font-size:12px; font-weight:600;  padding:0px; text-align:right">${parseFloat(icostrow).toFixed(2)}</td>
                        <td class="row-unitcost" style="color:blue; font-size:12px; font-weight:600;  padding:0px; text-align:right">${parseFloat(Ucostrow).toFixed(2)}</td>
                        <td style="color:blue; font-size:12px; font-weight:600;  padding:0px; text-align:right">${parseFloat(Svaluerow).toFixed(2)}</td>
                        <td class="row-unitmargin" style="color:blue; font-size:12px; font-weight:600;  padding:0px; text-align:right">${parseFloat(Umarginrow).toFixed(2)}</td>
                        <td style="color:blue; font-size:12px; font-weight:600;  padding:0px">${statusrow}</td>
                        <td style="color:blue; font-size:12px; font-weight:600;  padding:0px">${Invnorow}</td>
                    `;

                    // 5. Append the row to the bottom of the table body
                    tableBody.appendChild(newRow);
                    recalculateNewInvoiceSerialNumbers();
                    // Execute the calculation
                    calculateInvGrandtotal();
                    // 6. Clear input fields for the next entry
                    itemcode.value = '';
                    item.focus();
                    item.value = '';
                    quantity.value = '1';
                    isize.value = '-';
                    iral.value = '-';
                    iunit.value = '-';
                    uprice.value = '0.00';

                    udiscper.value = '0.00';
                    uvatper.value = '5.00';
                    utaxable.value = '0.00';
                    vattotal.value = '0.00';
                    utotal.value = '0.00';
                    id.value = '';
                    stock.value = '0';
                    openstock.value = '0';
                    }); 

                    // 🎯 9. HELPER FUNCTION TO RE-INDEX ROWS UPON DELETIONS
                    function recalculateNewInvoiceSerialNumbers() {
                        const rows = tableBody.querySelectorAll('tr');
                        rows.forEach((row, index) => {
                            const srNoCell = row.querySelector('.row-sr-no');
                            if (srNoCell) {
                                srNoCell.innerText = index + 1; // Updates sequence cleanly to 1, 2, 3...
                            }
                        });
                    }
//#endregion 
//#region     UPDATE ITEMS MODAL BY UPDATE BUTTON
document.getElementById("invitems-update-button").addEventListener("click", function(e) {
// 🎯 PREVENT THE BUTTON FROM TRIPPING OTHER MODAL CLOSE EVENTS OR RELOADS
    e.preventDefault();
    e.stopPropagation();

    // 1. Safety check to make sure a row is actually being edited
    if (!activeEditingRow) return;

    // 2. Get the table cells of the active row
    const targetCells = activeEditingRow.cells;
    //console.log(targetCells[1].textContent);
    // 3. Update the cells with the new values from the modal inputs
    // Note: Match the indices (1, 2, 3...) with your original population code
    targetCells[1].textContent = document.getElementById("invitems-sr-number").value;
    targetCells[2].textContent = document.getElementById("invitems-product").value;
    targetCells[3].textContent = document.getElementById("invitems-qty").value;
    targetCells[5].textContent = document.getElementById("invitems-i-size").value;
    
    targetCells[6].textContent = document.getElementById("invitems-i-ral").value;
    targetCells[7].textContent = document.getElementById("invitems-i-unit").value;
    // 🎯 Force Unit Price to 10.00 format
    const unitPriceValue = parseFloat(document.getElementById("invitems-unit-price").value) || 0;
    targetCells[8].textContent = unitPriceValue.toFixed(2);
    // 🎯 Force Discount Percentage to 10.00 format
    const discPerValue = parseFloat(document.getElementById("invitems-disc-per").value) || 0;
    targetCells[9].textContent = discPerValue.toFixed(2);
    
    // 🎯 Force VAT Percentage to 10.00 format
    const vatPerValue = parseFloat(document.getElementById("invitems-vat-per").value) || 0;
    targetCells[10].textContent = vatPerValue.toFixed(2);
    // 🎯 Force Taxable Amount to 10.00 format
    const taxableValue = parseFloat(document.getElementById("invitems-taxable").value) || 0;
    targetCells[11].textContent = taxableValue.toFixed(2);
       // 🎯 Force VAT Total to 10.00 format
    const vatTotalValue = parseFloat(document.getElementById("invitems-vat-total").value) || 0;
    targetCells[12].textContent = vatTotalValue.toFixed(2);
    // 🎯 Force Unit Total to 10.00 format
    const unitTotalValue = parseFloat(document.getElementById("invitems-unit-total").value) || 0;
    targetCells[13].textContent = unitTotalValue.toFixed(2);
    
    targetCells[14].textContent = document.getElementById("invitems-pid").value;
    // For stock, map it back to your actual target tracking requirements 
    targetCells[15].textContent = document.getElementById("invitems-a-stock").value; 
    // 🎯 Force I cost to 10.00 format
    const IcostValue = parseFloat(document.getElementById("invitems-i-cost").value) || 0;
    targetCells[16].textContent = IcostValue.toFixed(2);
    // 🎯 Force U cost to 10.00 format
    const UcostValue = parseFloat(document.getElementById("invitems-u-cost").value) || 0;
    targetCells[17].textContent = UcostValue.toFixed(2);
    // 🎯 Force S value to 10.00 format
    const SValue = parseFloat(document.getElementById("invitems-s-value").value) || 0;
    targetCells[18].textContent = SValue.toFixed(2);
    // 🎯 Force Umargin to 10.00 format
    const Umargin = parseFloat(document.getElementById("invitems-u-margin").value) || 0;
    targetCells[19].textContent = Umargin.toFixed(2);

    // 🎯 1. Apply the temporary visual flash effect to the row
    activeEditingRow.classList.add("flash-updated-row");

    // 🎯 2. Automatically remove the class after the animation ends (2 seconds) 
    // so it can flash again if edited a second time
    const rowToClear = activeEditingRow; // Hold reference for the timeout
    setTimeout(() => {
        rowToClear.classList.remove("flash-updated-row");
    }, 2000);

    // 4. Close your secondary modal (Example ID)
    document.getElementById("invitems-modal-overlay").style.display = "none";
    document.getElementById("invitems-transaction-form").reset();
    // 5. Clean up the reference 
    activeEditingRow = null;
    //closeAppModal();

    // Pattern Matching Scanner: Checks if ANY structural modal container layout is active
                const genericModalOpen = Array.from(
                  document.querySelectorAll('[id$="-modal-overlay"]')).filter((m) => m.style.display === "flex").length;

                if (genericModalOpen === 0) {
                  lockSidebarAndRefresh(false);
                }

                // 1. Unlock the parent window mechanisms
                if (window.parent && window.parent.lockSidebarAndRefresh && genericModalOpen === 0 ) {
                  window.parent.lockSidebarAndRefresh(false);
                }

                // 2. Remove the local iframe listener
                window.removeEventListener("keydown", localIframeBlockRefresh);
                calculateInvGrandtotal();
    
});

//#endregion
//#region     EDIT INVOICE MODAL CLOSE
              function closeEditModal() {
                document.getElementById("editinv-modal-overlay").style.display =
                  "none";
                document.getElementById("edit-invoice-master-form").reset();
                document.getElementById("edit-modal-items-rows").innerHTML = "";

                // Remove the lock class from the parent sidebar so links work again
                const parentSidebar =
                  window.parent.document.querySelector(".sidebar-pane");
                if (parentSidebar) {
                  parentSidebar.classList.remove("menu-locked");
                }
              }
//#endregion   
//#region     HIDE AND VISIBLE SECRET FIELDS STARTS   ===================//
        // Define your configuration constants
      const SECRET_PASSWORD = "admin123"; 
      const SESSION_DURATION = 30; // Total countdown time in seconds

      // 1. Select all modal/form containers instead of hardcoded unique IDs
      // Wrap your respective forms/tables inside a container element with this class name
      const lockableContainers = document.querySelectorAll('.global-modal');

      // A global registry map to hold cleanup functions for each container
      window.modalTimerCleanups = window.modalTimerCleanups || new Map();

      lockableContainers.forEach((container, index) => {
      // Assign a unique identification token key if your modal doesn't have an ID attribute
          const containerId = container.id || `global-modal-${index}`;
          container.setAttribute('data-lock-id', containerId);

    // 2. Scope selectors INSIDE this specific component wrapper
    const countdownSeconds = container.querySelector('.countdown-seconds');
    const invoiceForm = container.querySelector('.global-master-form');
    const invoiceTable = container.querySelector('.toggle-table');
    
    // 3. Keep tracking state variables strictly localized to this instance
    let secondsRemaining = SESSION_DURATION;
    let countdownInterval = null; 

    // Synchronized Lock Function for this specific component instance
    function lockSecretColumns() {
        if (invoiceTable) invoiceTable.classList.remove('show-secret');
        if (invoiceForm) invoiceForm.classList.remove('show-secret'); 
        
        if (countdownSeconds) {
            countdownSeconds.style.display = 'none';
        }
        
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
    }

    function startCountdownTimer() {
        if (countdownInterval) clearInterval(countdownInterval);
        
        secondsRemaining = SESSION_DURATION;
        
        if (countdownSeconds) {
            countdownSeconds.textContent = secondsRemaining;
            countdownSeconds.style.display = 'block';
        }

        countdownInterval = setInterval(() => {
            secondsRemaining--;
            if (countdownSeconds) {
                countdownSeconds.textContent = secondsRemaining;
            }

            if (secondsRemaining <= 0) {
                lockSecretColumns();
            }
        }, 1000);
    }

    // User Interaction Extension Listener scoped to this instance
    function resetTimerOnActivity() {
        if (!invoiceTable || !invoiceTable.classList.contains('show-secret')) return;
        startCountdownTimer();
    }
// Save this specific modal instance closure cleanup reference into the global map register
    window.modalTimerCleanups.set(containerId, lockSecretColumns);

    // Guard checking if the required elements exist in this container
    if (!invoiceForm || !invoiceTable) return;

    // Double Click Access Handler Event Invocations
    invoiceForm.addEventListener('dblclick', function(event) {
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'BUTTON') return;

        if (invoiceTable.classList.contains('show-secret')) {
            lockSecretColumns();
            return;
        }

        const passwordInput = prompt("Enter manager password to view restricted columns:");

        if (passwordInput === SECRET_PASSWORD) {
            invoiceTable.classList.add('show-secret');
            invoiceForm.classList.add('show-secret'); 
            startCountdownTimer(); 
        } else if (passwordInput !== null) {
            alert("Incorrect password. Access denied.");
        }
    });

    // Keep columns open if the manager is actively working in this specific form area
    invoiceForm.addEventListener('mousemove', resetTimerOnActivity);
    invoiceForm.addEventListener('keypress', resetTimerOnActivity);
});

                              // GLOBAL EXPOSED FUNCTION: Call this whenever you execute your modal hiding actions
                  window.forceResetModalLock = function(containerIdentifier) {
                  if (window.modalTimerCleanups && window.modalTimerCleanups.has(containerIdentifier)) {
                      const cleanupFn = window.modalTimerCleanups.get(containerIdentifier);
                      cleanupFn(); // Instantly clears interval and strips UI highlight classes
                  }
                };
             
//#endregion 
//#endregion=====EDIT INVOICE MODAL ENDS===========

//#region  NEW CREDIT NOTE AND 📌 DELIVERY NOTE CODES 📌
            // Credit Qty drives the refund; Qty remains the original invoice reference.
            function recalculateCreditRow(row) {
                const input=row.querySelector('.credit-cn-qty');
                if(!input)return;
                const quantity=Number(input.value),maximum=Number(row.dataset.maxCreditQuantity);
                const valid=input.value.trim()!==''&&Number.isSafeInteger(quantity)&&quantity>=0&&quantity<=maximum;
                input.setAttribute('aria-invalid',String(!valid));
                input.setCustomValidity(valid?'':`Enter a whole quantity from 0 to ${maximum}.`);
                const qty=valid?quantity:0,price=Number(row.cells[5].textContent)||0,discount=Number(row.cells[6].textContent)||0,vat=Number(row.cells[7].textContent)||0;
                const round=value=>Math.round((value+Number.EPSILON)*100)/100;
                const taxable=round(qty*price*(1-discount/100)),vatTotal=round(taxable*vat/100);
                row.cells[8].textContent=taxable.toFixed(2);row.cells[9].textContent=vatTotal.toFixed(2);row.cells[10].textContent=round(taxable+vatTotal).toFixed(2);
                const stock=(Number(row.dataset.openStock)||0)+qty,cost=Number(row.cells[13].textContent)||0;
                row.cells[12].textContent=stock;row.cells[14].textContent=round(qty*cost).toFixed(2);row.cells[15].textContent=round(stock*cost).toFixed(2);
                calculateCreditGrandtotal();
            }

//#region     CALCULATE GRAND TOTAL CREDIT NOTES
            function calculateCreditGrandtotal() {
            let grossTaxable = 0;
            let grossVat = 0;
            let grossUnitTotal = 0;
            let invPaid = 0;

            // 1. Gather all dynamic rows currently present inside the table body
            const taxableCells = document.querySelectorAll('.credit-row-taxable');
            const vatCells = document.querySelectorAll('.credit-row-vattotal');
            const totalCells = document.querySelectorAll('.credit-row-unittotal');

           
            
            // 2. Loop through and aggregate the values
            taxableCells.forEach(cell => grossTaxable += parseFloat(cell.textContent) || 0);
            vatCells.forEach(cell => grossVat += parseFloat(cell.textContent) || 0);
            totalCells.forEach(cell => grossUnitTotal += parseFloat(cell.textContent) || 0);

            invPaid = document.getElementById('credit-paid-value').value
            const paidAmount = parseFloat(invPaid);

            const invBalace = parseFloat(grossUnitTotal) - paidAmount;
            //   if (parseFloat(grossUnitTotal) === paidAmount) {
            //     document.getElementById('credit-status').value = "Paid";
                
            //   }
            //   else if (paidAmount < parseFloat(grossUnitTotal)) {
            //     document.getElementById('credit-status').value = "Adv.Paid";
            //   }
            //   else{
            //     document.getElementById('credit-status').value = "Pending";
            //   }

              // 1. First, populate the text field with the string value from your database
                      // const statusFromDatabase = document.getElementById('credit-status').value;
                      // const liveStatus = document.getElementById('credit-status');

                      // liveStatus.value = statusFromDatabase;
                      // // 2. RUN THE STYLE COLORING IMMEDIATELY (No event listener wrapper needed!)
                      // const currentStatus = (liveStatus.value || "").trim();
                      // // Add clean text design styles
                      // liveStatus.style.color = "white";

                      // if (currentStatus === "Paid" || currentStatus === "PAID") {
                      //   liveStatus.style.backgroundColor = "green";
                      // } 
                      // else if (currentStatus === "Adv.Paid" || currentStatus === "ADV.PAID") {
                      //   liveStatus.style.backgroundColor = "blue";
                      // } 
                      // else if (currentStatus === "Pending" || currentStatus === "PENDING") {
                      //   liveStatus.style.backgroundColor = "red";
                      // } 
                      // else {
                      //   // Default fallback styling if empty or unrecognized status
                      //   liveStatus.style.backgroundColor = "#6c757d"; // standard gray
                      // }
              

            // 3. Render the output directly inside your summary text inputs
            document.getElementById('credit-taxable-value').value = grossTaxable.toFixed(2);
            document.getElementById('credit-total-vat').value = grossVat.toFixed(2);
            document.getElementById('credit-grand-total').value = grossUnitTotal.toFixed(2);
            document.getElementById('credit-amount-in-words').value = toWordsConfig.convert(Number(grossUnitTotal.toFixed(2)));
            document.getElementById('credit-balance-value').value = invBalace.toFixed(2);
           // document.getElementById('credit-paid-value').value = invBalace.toFixed(2);
            }

            // 🎯 9. HELPER FUNCTION TO RE-INDEX ROWS UPON DELETIONS
                    function recalculateNewCreditSerialNumbers() {
                        // const rows = tableBody.querySelectorAll('tr');
                        // rows.forEach((row, index) => {
                        //     const srNoCell = row.querySelector('.row-sr-no');
                        //     if (srNoCell) {
                        //         srNoCell.innerText = index + 1; // Updates sequence cleanly to 1, 2, 3...
                        //     }
                        // });
                        // Grab all rows inside your table body (update selector matching your table's ID)
                      const rows = document.querySelectorAll("#credit-table tbody tr");                      
                      rows.forEach((row, index) => {
                          // Assuming targetCells[1] holds your "invitems-sr-number" value
                          if (row.cells[1]) {
                              row.cells[1].textContent = index + 1;
                          }
                      });
                    }
//#endregion
//#region     SAVE CREDIT NOTE API BY SAVE BUTTON
        document.getElementById("btn-save-credit-note").addEventListener("click", async function() {
          
          // 1. Gather master fields from your top form inputs layout elements
          const invoiceMainData = {
           Customer : document.getElementById("credit-customer").value,
           PostBox : document.getElementById("credit-postbox").value, 
           Emirate : document.getElementById("credit-emirate").value, 
           Address : document.getElementById("credit-address").value, 
           TRN : document.getElementById("credit-vat-no").value, 
           LPONo : document.getElementById("credit-lpo").value, 
           CONo : document.getElementById("credit-co-no").value, 
           Description : document.getElementById("credit-notes").value,
           InvoiceNo : document.getElementById("credit-invoice-no").value,
           CreditDate : document.getElementById ("credit-date")?.value,
           InvoiceDate : document.getElementById ("credit-invoice-date")?.value,

           SubTotal : parseFloat(document.getElementById("credit-taxable-value")?.value || 0),
           VatTotal : parseFloat(document.getElementById("credit-total-vat")?.value || 0),
           GrandTotal : parseFloat(document.getElementById("credit-grand-total")?.value || 0),
           Paid : parseFloat(document.getElementById("credit-paid-value")?.value || 0),
           Balance : parseFloat(document.getElementById("credit-balance-value")?.value || 0),
           Status : document.getElementById("credit-status").value,
           InWords : document.getElementById("credit-amount-in-words").value,
          };

          // 2. Read and map your active row item array configurations dynamically 
          const itemsArray = [];
          const rows = document.querySelectorAll("#credit-note-modal-items-rows tr");

          if (Array.from(rows).some(row => {
            const remaining = Number(row.dataset.maxCreditQuantity);
            const input = row.querySelector('.credit-cn-qty');
            const quantity = Number(input?.value);
            return row.dataset.maxCreditQuantity !== undefined && (!input || input.value.trim() === '' || !Number.isSafeInteger(quantity) || quantity < 0 || quantity > remaining);
          })) { alert('Credit-note quantity must be greater than zero and cannot exceed the remaining CN Qty.'); return; }
          rows.forEach(row => {
            // Collect the dynamic modified quantities inputs from the cells template
            const qtyInput = row.querySelector(".credit-cn-qty");
            
            if (qtyInput && Number(qtyInput.value) > 0) {
              itemsArray.push({
                itemID: row.cells[0].textContent.trim(),
                SrNo: row.dataset.invoiceSrNo || row.cells[1].textContent.trim(),
                Item: row.cells[2].textContent.trim(),
                qty: qtyInput.value,
                CNQty: Number(qtyInput.value),
                ReferenceQty: Number(row.cells[3].textContent.trim()),
                UnitPrice: row.cells[5].textContent.trim(),
                Discount: row.cells[6].textContent.trim(),
                VatPer: row.cells[7].textContent.trim(),
                Taxable: row.cells[8].textContent.trim(),
                VatTotal: row.cells[9].textContent.trim(),
                UnitTotal: row.cells[10].textContent.trim(),
                PID: row.cells[11].textContent.trim(),
                Stock: row.cells[12].textContent.trim(),
                cost: row.cells[13].textContent.trim(),
                tcost: row.cells[15].textContent.trim()
              });
            }
          });

          // Verification step
          if (itemsArray.length === 0) {
            alert("Cannot save an empty Credit Note document.");
            return;
          }

          // 3. Assemble the structural JSON data payload container
          const payloadData = {
            main: invoiceMainData,
            requestId: document.getElementById('credit-note-modal-items-rows').dataset.requestId,
            items: itemsArray
          };

          try {
            // 4. Dispatch AJAX data package via HTTP pipeline
            const response = await fetch('/api/save-credit-note', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payloadData)
            });

            const result = await response.json();

            if (result.success) {
              // alert(`Credit Note Saved as No: ${result.allocatedNumber} and Stock Restored`);
              alert(result.message);
               // Unlock page mechanisms and close main modal here
                  window.removeEventListener("keydown", localIframeBlockRefresh);
                  if (window.parent && window.parent.lockSidebarAndRefresh) {
                      window.parent.lockSidebarAndRefresh(false);
                  }
                  document.getElementById("editinv-modal-overlay").style.display = "none";

             //====================================================//
            // 1. Close this second modal (using your existing modal close code)
            // e.g., mySecondModal.close() or $('#secondModal').modal('hide');

            // 2. Reach out to the parent (index.html) to interact with its DOM
            const parentDoc = window.parent.document;

            // 3. Find and click the parent dropdown button to open it
            const dropdownButton = parentDoc.getElementById("btn-creditnote");
            if (dropdownButton) {
                dropdownButton.click(); 
            }

            // 4. Find and click the specific link inside that dropdown
            const dropdownLink = parentDoc.getElementById("view-credit-notes");
            if (dropdownLink) {
                dropdownLink.click();
            }

            // 5. Force the index.html iframe to load the new HTML file
            const mainIframe = parentDoc.getElementById("main-content-viewport");
            if (mainIframe) {
                mainIframe.src = "/creditnotes"; // Adjust the path as necessary
            }

             //===================================================//


              // 5. Notify the manager and show them the exact final tracking ID stamped by your database pool
              
              
              // Close out overlays and refresh your main data metrics panels
              document.getElementById("credit-note-modal-overlay").style.display = "none";
              if (typeof refreshMainInvoiceGridData === "function") refreshMainInvoiceGridData();
              
            } else {
              alert(`Error saving document: ${result.message}`);
            }

            } catch (error) {
              console.error("[FRONTEND AJAX EXCEPTION] Data submission pipeline broke down:", error);
              alert("Critical transmission failure. Could not connect to the Node.js backend server.");
            }
          });
//#endregion
//#region     SAVE DELIVERY NOTE API BY SAVE BUTTON
document.getElementById("btn-save-do").addEventListener("click", async function(e) {

    async function saveDeliveryNote(){
            e.preventDefault();
            e.stopPropagation();

        // 1. 📋 Gather data for the 'invoicemain' master table
    const deliveryMainData = {
        InvoiceNo: parseInt(document.getElementById("do-invoice-no")?.value),
        Customer: document.getElementById("do-customer")?.value,
        Postbox: document.getElementById("do-postbox")?.value || "-",
        Emirate: document.getElementById("do-emirate")?.value,
        Address: document.getElementById("do-address")?.value,
        VatID: document.getElementById("do-vat-no")?.value || "-",
        DODate: document.getElementById("do-date")?.value,
        LPONo: document.getElementById("do-lpo")?.value || "-",
        // coNo: document.getElementById("do-co-no")?.value || "-",
        PaymentTerms: document.getElementById("do-payment-terms")?.value || "IMMEDIATE",
        CustContact: document.getElementById("do-contact-person")?.value || "Mr.",
        CustConNumber: document.getElementById("do-contact-number")?.value || "N/A",
        DeliveryPlace: document.getElementById("do-delivery-place")?.value || "STORE",
        DeliveryDate: document.getElementById("do-deldate")?.value,
        OurContact: document.getElementById("do-our-contact")?.value || "HABEEB RAHMAN",
        OurNumber: document.getElementById("do-our-number")?.value || "054 3893545",
        Description: document.getElementById("do-notes")?.value || "N/A",

        // invCost: parseFloat(document.getElementById("do-tcost")?.value || 0),
        // invMargin: parseFloat(document.getElementById("do-tmargin")?.value || 0),
        // subTotal: parseFloat(document.getElementById("do-taxable-value")?.value || 0),
        // vatTotal: parseFloat(document.getElementById("do-total-vat")?.value || 0),
        // grandTotal: parseFloat(document.getElementById("do-grand-total")?.value || 0),
        // Received: parseFloat(document.getElementById("do-paid-value")?.value || 0),
        // Balance: parseFloat(document.getElementById("do-balance-value")?.value || 0),
        // Status: document.getElementById("do-status-value")?.value || "Pnding",
        // inWords: document.getElementById("do-amount-in-words")?.value || "AED:",
    };

    // 2. 📋 Gather item rows for the 'invoices' details table
    const deliveryItemsData = [];
    const rows = document.querySelectorAll("#do-table tbody tr"); // Update with your actual table ID

    rows.forEach((row) => {
        const cells = row.cells;
        // Make sure it's a valid data row and not an empty placeholder
        if (cells && cells.length > 0) {
            deliveryItemsData.push({
                SrNo: cells[0].textContent.trim(),
                Item: cells[1].textContent.trim(),
                Quantity: parseInt(cells[2].textContent.trim(), 10) || 1,
                ISize: cells[3].textContent.trim(),
                IRAL: cells[4].textContent.trim(),
                IUnit: cells[5].textContent.trim(),
                // unitprice: parseFloat(cells[7].textContent.trim()) || 0,
                // discper: parseFloat(cells[8].textContent.trim()) || 0,
                // vatper: parseFloat(cells[9].textContent.trim()) || 0,
                // taxable: parseFloat(cells[10].textContent.trim()) || 0,
                // vattotal: parseFloat(cells[11].textContent.trim()) || 0,
                // unittotal: parseFloat(cells[12].textContent.trim()) || 0,
                // pid: cells[13].textContent.trim(),//1
                // astock: parseInt(cells[14].textContent.trim()),//2
                // icost: parseFloat(cells[15].textContent.trim()) || 0,//3
                // ucost: parseFloat(cells[16].textContent.trim()) || 0,
                // svalue: parseFloat(cells[17].textContent.trim()) || 0,//4
                // umargin: parseFloat(cells[18].textContent.trim()) || 0,
                // status: cells[19].textContent.trim() || "Delivered",
                // status: "Delivered",
                // invoiceNo: parseInt(document.getElementById("edit-invoice-number")?.value),
            });
        }
    });

          // 3. 🛡️ Quick validation: Ensure there is at least one item to save
          if (deliveryItemsData.length === 0) {
              alert("Cannot save an empty invoice. Please add items first.");
              return;
          }

          // 4. 🚀 Package everything into a payload object
          const payload = {
              main: deliveryMainData,
              items: deliveryItemsData
          };

    // 5. 📨 Send payload via AJAX Fetch API to your server backend
          try {
              const response = await fetch("/api/save-delivery-order", { // Update to your API file path (e.g., .php, .asp, /api/invoice)
                  method: "POST",
                  headers: {
                      "Content-Type": "application/json"
                  },
                  body: JSON.stringify(payload)
              });

              const result = await response.json();

              if (result.success) {
                  // alert("Delivery Order - " + invoiceMainData.invoiceNo +   " - Saved Successfully!");
                  alert(result.message);
                  // Unlock page mechanisms and close main modal here
                  window.removeEventListener("keydown", localIframeBlockRefresh);
                  if (window.parent && window.parent.lockSidebarAndRefresh) {
                      window.parent.lockSidebarAndRefresh(false);
                  }
                  document.getElementById("do-modal-overlay").style.display = "none";
                  //fetchFilteredInvoices();
                  //====================================================//
            // 1. Close this second modal (using your existing modal close code)
            // e.g., mySecondModal.close() or $('#secondModal').modal('hide');

            // 2. Reach out to the parent (index.html) to interact with its DOM
            const parentDoc = window.parent.document;

            // 3. Find and click the parent dropdown button to open it
            const dropdownButton = parentDoc.getElementById("btn-deliveryorders");
            if (dropdownButton) {
                dropdownButton.click(); 
            }

            // 4. Find and click the specific link inside that dropdown
            const dropdownLink = parentDoc.getElementById("view-deliveryorders");
            if (dropdownLink) {
                dropdownLink.click();
            }

            // 5. Force the index.html iframe to load the new HTML file
            const mainIframe = parentDoc.getElementById("main-content-viewport");
            if (mainIframe) {
                mainIframe.src = "/deliveryorders"; // Adjust the path as necessary
            }

             //===================================================//
                  
              } else {
                  alert("Database Error: " + result.message);
              }
          } catch (error) {
              console.error("Transmission Error:", error);
              alert("Failed to connect to the server database endpoint.");
          }
        }//function end
        saveDeliveryNote();
    })// button click end
     
//#endregion
//#endregion=====NEW CREDIT NOTE ENDS===========

//#region  ALL INVOICE PAYMENT CODES 📌
//#region     PAYMENT MODAL CHEQUE INPUT, CLOSE PAYMENT MODAL, UPDATE PAYMENT

              // Bind this explicitly in your script to catch selection changes instantly
                document.getElementById("modal-mode-select").addEventListener("change", function(e) {
                  toggleChequeInput(e.target.value);
                });


                function toggleChequeInput(paymentMode) {
                const chequeRow = document.getElementById("modal-cheque-row");
                if (paymentMode === "Cheque" || paymentMode === "PDC") {
                  // 🎯 Show input for Cheque or PDC
                  chequeRow.style.display = "block";
                  document.getElementById("modal-chq-no").required = true;
                  document.getElementById("modal-chq-no").focus();
                } else {
                  chequeRow.style.display = "none";
                  document.getElementById("modal-chq-no").required = false;
                  document.getElementById("modal-chq-no").value = "";
                }
              }

              function closePaymentModal() {
                document.getElementById("payment-modal-overlay").style.display =
                  "none";
                document.getElementById("payment-transaction-form").reset();
                // Drop row border outline styles on form cancel/close clicks
                document
                  .querySelectorAll("#invoice-rows tr")
                  .forEach((row) =>
                    row.classList.remove("invoices-row-highlight-context"),
                  );
              }
              const updateBtn = document.getElementById("payment-btn-update"); // Replace with your actual button ID
              const chqInput = document.getElementById("modal-chq-no");

              // 🎯 FORM POST TRANSMISSION: DISPATCH DATA DIRECTLY TO SERVER BACKEND API
              updateBtn.addEventListener("click", function (e) {
                 // 1. Get the current selected payment mode value
                  const currentMode = document.getElementById("modal-mode-select").value;
                  // 2. Run your toggle rule one more time just to ensure total sync
                  toggleChequeInput(currentMode);
                  // 3. MANUAL VALIDATION CHECK: If the field is marked required but is empty
              if (chqInput.required && chqInput.value.trim() === "") {
                alert("Please enter the Cheque / PDC Number.");
                chqInput.focus(); // Drop the user's cursor right into the missing input field
                return; // STOP execution here so it doesn't submit blank data!
              }
                  e.preventDefault();
                  
                  const amountPaidInput = parseFloat(document.getElementById("modal-amount-to-pay").value,) || 0;
                  const cleanBalanceStr = document.getElementById("modal-current-balance").value.replace(/,/g, "");
                  const currentRemainingBalance = parseFloat(cleanBalanceStr) || 0;

                  // 🎯 THE FIX: Only enforce the "greater than zero" check if there is an actual remaining balance!
                  if (currentRemainingBalance > 0 && amountPaidInput <= 0) {
                    alert(
                      "Please input a valid transaction amount greater than zero to reduce the remaining balance.",
                    );
                    return;
                  }

                  if (amountPaidInput > currentRemainingBalance) {
                    alert(
                      "Warning: Transaction payment cannot exceed the current outstanding invoice balance!",
                    );
                    return;
                  }

                  const transactionPayload = {
                    InvoiceNo: String(activeSelectedInvoiceNo).trim(),AmountPaid: amountPaidInput,
                    Mode: document.getElementById("modal-mode-select").value,
                    Receiveddate: document.getElementById("modal-date-input").value,
                    ChqNo: document.getElementById("modal-chq-no").value.trim(),
                  };

                  fetch("/api/receive-payment", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(transactionPayload),
                  })
                    .then((res) => res.json())
                    .then((response) => {
                      if (response.success) {
                       // Unlock page mechanisms and close main modal here
                  window.removeEventListener("keydown", localIframeBlockRefresh);
                  if (window.parent && window.parent.lockSidebarAndRefresh) {
                      window.parent.lockSidebarAndRefresh(false);
                  }
                  document.getElementById("payment-modal-overlay").style.display = "none";
                        fetchFilteredInvoices();
                      } else {
                        alert("❌ REJECTED BY SERVER:\n" + response.error);
                      }
                    })
                    .catch((error) => {
                      console.error("Network communication exception: ", error);
                      alert("❌ NETWORK ERROR: Check your connection logs.");
                    });
                });

              // 🎯 MASTER INVOICE HEADER FIELDS SAVE SUBMITTER LISTENER
              const editMasterForm = document.getElementById(
                "edit-invoice-master-form",
              );
              if (editMasterForm) {
                editMasterForm.addEventListener("submit", function (e) {
                  e.preventDefault();

                  const masterUpdatePayload = {
                    InvoiceNo: document.getElementById("edit-invoice-number").value,
                    Customer: document
                      .getElementById("customer")
                      .value.trim(),
                    InvoiceDate: document.getElementById("edit-date").value,
                    LPONo: document.getElementById("edit-lpo").value.trim(),
                    Emirate: document
                      .getElementById("edit-emirate")
                      .value.trim(),
                  };
            // ====  update Invoice main  ===============//
                  fetch("/api/update-invoice-master", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(masterUpdatePayload),
                  })
                    .then((res) => res.json())
                    .then((response) => {
                      if (response.success) {
                        alert(
                          "Success! Invoice master fields updated cleanly.",
                        );
                        closeEditModal();
                        fetchFilteredInvoices(); // Instantly refresh row display
                      } else {
                        alert("❌ SQL REJECTION: " + response.error);
                      }
                    })
                    .catch((err) => {
                      alert(
                        "❌ NETWORK ERROR: Unable to save master corrections.",
                      );
                    });
                });
              }
//#endregion
//#region     LEFT CLICK SELECTION MULTI INVOICE PAYMENT
  // ⚡ LEFT-CLICK MULTI-SELECTION LISTENER
            document.getElementById("multipayment-modal-items-rows").addEventListener("click", function (e) {
              const clickedRow = e.target.closest("tr");             
              // Exit if clicking outside a row, or if clicking an input text box/button inside the row
              if (!clickedRow || e.target.tagName === "INPUT" || e.target.tagName === "BUTTON") return;            
              // 💡 TOGGLE SELECTION ON LEFT-CLICK: Adds/removes orange/blue highlight class
              clickedRow.classList.toggle("row-selected-for-cn");
              updateMultiAmount();              
            });


                        // ⚡ BUTTON MULTI-SELECTION LISTENER
            document.getElementById("btn-selectall").addEventListener("click", function () {
              // 1. Get all table rows inside the modal container
              const allRows = document.querySelectorAll("#multipayment-modal-items-rows tr");
              if (allRows.length === 0) return; // Exit if table is empty

              // 2. Check if all rows are already selected
              const selectedRows = document.querySelectorAll("#multipayment-modal-items-rows tr.row-selected-for-cn");
              const isAllSelected = allRows.length === selectedRows.length;

              // 3. Toggle the class based on the current state
              allRows.forEach(row => {
                if (isAllSelected) {
                  // If all are selected, clear them all (Deselect All)
                  row.classList.remove("row-selected-for-cn");
                } else {
                  // If some or none are selected, select them all (Select All)
                  row.classList.add("row-selected-for-cn");
                }
              });

              // 4. Update the total amount once after modifying the rows
              updateMultiAmount();
              
              // Optional: Update button text dynamically
              this.textContent = isAllSelected ? "Select All" : "Deselect All";
            });

            const btnUpdate = document.getElementById('btn-update-multipayment');
            const multiTable = document.getElementById('multipayment-invoice-table');
            const totalAmt = document.getElementById('multipayment-grand-total');
            const totalWord = document.getElementById('multipayment-amount-in-words');
            const InvCount = document.getElementById('multipayment-inv-count');
            const InvPayCount = document.getElementById('multipayment-count');
            const CnTotal = document.getElementById('multipayment-cnamount');
            const GTotal = document.getElementById('multipayment-grandtotal');
            
            function updateMultiAmount() {
              let total = 0;
              let cntotal = 0;
              let Baltotal = 0;
              // Find all unique rows that are currently marked as selected
              const selectedRows = multiTable.querySelectorAll('tbody tr.row-selected-for-cn');
              
              selectedRows.forEach(row => {
                const Balamount = parseFloat(row.getAttribute('data-balance')) || 0;
                const amount = parseFloat(row.getAttribute('data-amount')) || 0;
                const cnamount = parseFloat(row.getAttribute('data-cnamount')) || 0;
                total += amount;
                Baltotal += Balamount;
                cntotal += cnamount;
              });

              // Format the number to 2 decimal places
              const actualPay = Baltotal;
              // const actualPay = total - cntotal;
              const amountInWords = toWordsConfig.convert(actualPay);
              totalWord.value = amountInWords;
              GTotal.value = `${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              totalAmt.value = `${actualPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              InvPayCount.value = selectedRows.length;
              CnTotal.value = `${cntotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              if(selectedRows.length > 0){
                btnUpdate.classList.remove('disabled');
              }
              else{
                btnUpdate.classList.add('disabled');
              }
            }
//#endregion
//#region     UPDATE MULTI INVOICE PAYMENT
           
            document.getElementById("btn-update-multipayment").addEventListener("click", () => {
               const tablePay = document.getElementById('multipayment-invoice-table');
            let StatusValue = "Paid"
            const ChqNo = document.getElementById("multipayment-chq-no").value;
            const Status = document.getElementById("multipayment-mode-select").value;
            if(Status === "Cash" || Status === "Bank Transfer" || Status === "Bank Deposit" || Status === "Bank Card" || Status === "Cheque" ){
              StatusValue = "Paid";
            } else if(Status === "PDC"){
              StatusValue = "PDC";
            }
            const ReceivedDate = document.getElementById ("multipayment-date-input")?.value;
            const SelectionInv = tablePay.querySelectorAll('tbody tr.row-selected-for-cn');
           
              const selectedItems = Array.from(SelectionInv).map(SelectedRow => {
                const rawDate = SelectedRow.getAttribute('data-invoicedate');
                  return {
                      InvoiceNo: parseInt(SelectedRow.getAttribute('data-invoice'), 10),
                      Received: parseFloat(SelectedRow.getAttribute('data-balance')),
                      InvoiceDate: rawDate ? new Date(rawDate) : null
                  };
              });
              // console.log(selectedItems, StatusValue, ChqNo, Status, ReceivedDate );
            // PDCtitle.textContent = selectedInvoices.join(", ");
            // Safety check: Don't send an empty request
            if (selectedItems.length === 0) {
                alert("Please select at least 1 invoice.");
                return;
            }

            // 2. Send the data to your backend API route
            fetch('/api/update-multipayment-status', { // Replace with your actual backend URL
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    selectedItems,
                    Status: StatusValue, 
                    Receiveddate: ReceivedDate,
                    Mode: Status, 
                    ChqNo: ChqNo,
                    Balance: 0

                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    
                  window.removeEventListener("keydown", localIframeBlockRefresh);
                  if (window.parent && window.parent.lockSidebarAndRefresh) {
                      window.parent.lockSidebarAndRefresh(false);
                  }
                  document.getElementById("multipayment-modal-overlay").style.display = "none";
                  document.getElementById('multipayment-invoice-master-form').reset();
                  document.getElementById('multipayment-modal-items-rows').innerHTML = '';
                  fetchFilteredInvoices();
                } else {
                    alert("Database update failed: " + data.message);
                }
            })
            .catch(error => {
                console.error("Network Error:", error);
            });

            });
//#endregion
//#region     FETCH MULTI INVOICE PAYMENT MODAL TABLE 
 function  FetchMutltiInvoicePayModal() {
                let Balance = 0;
                const multiTable = document.getElementById('multipayment-modal-items-rows');
                // const cleanChq = String(activeSelectedChqNo).replace(/<[^>]*>/g, "").trim();
                const payload = {
                  // cleanChqNo: cleanChq,
                  Customer: activeSelectedCustomer

                  //timeRange: document.getElementById("dash-filter-range").value
                };
                
                //console.log(payload)
                fetch("/api/multi-invoice-payment",{
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                }) // Replace with your actual backend endpoint URL
                .then(response => response.json())
                .then(data => {          
                multiTable.innerHTML = "";

              if (!data.multiInvoice || data.multiInvoice.length === 0) {
                alert("No Pending Invoices for Customer: " + (activeSelectedCustomer || "No records found."));
                return; // This will successfully exit your main function
                }

                 
                     // 1. 🎯 LOCK THE PARENT SIDEBAR AND GLOBAL WINDOW REFRESH
                  if (window.parent && window.parent.lockSidebarAndRefresh) {window.parent.lockSidebarAndRefresh(true);}
                  // 2. 🎯 LOCK REFRESH KEYS LOCALLY INSIDE THE IFRAME AS WELL
          window.addEventListener("keydown", localIframeBlockRefresh);
                  const rawMode = "Cash";
                      // Loop through each database record
                      document.getElementById("multipayment-modal-title").innerText ="PAYMENT FOR - " + activeSelectedCustomer;
                      document.getElementById("multipayment-customer").value = activeSelectedCustomer || "";
                      document.getElementById("multipayment-emirate").value = activeSelectedEmirate || "ABU DHABI";
                      document.getElementById("multipayment-date-input").value = formattedDate;
                      document.getElementById("multipayment-mode-select").value = rawMode || "Cash";
                      // const ChqIn = document.getElementById("multipayment-cheque-row");
                      // ChqIn.style.display = "none";    
                      
               
            
          data.multiInvoice.forEach(row => {
          const tr = document.createElement('tr');
          // ADD THIS: Attach data attributes for your tooltip listener to read
            tr.setAttribute('data-type', 'invoices-rows');
            tr.setAttribute('data-customer', row.customer); // Make sure 'CustomerName' matches your DB field name
            tr.setAttribute('data-emirate', row.Emirate);
            tr.setAttribute('data-invoice', row.InvoiceNo);
            tr.setAttribute('data-cn', row.CNNumber);
            tr.setAttribute('data-amount', row.GrandTotal);
            tr.setAttribute('data-cnamount', row.CNAmount);
            tr.setAttribute('data-lpo', row.LPONo);
            tr.setAttribute('data-creditdate', row.CreditDate);
            tr.setAttribute('data-invoicedate', row.InvoiceDate);
            

            const amount = parseFloat(tr.getAttribute('data-amount')) || 0;
            const cnamount = parseFloat(tr.getAttribute('data-cnamount')) || 0;
            // Balance = amount - cnamount;

            const statusValue = (row.CNStatus);
            let rowTextColorStyle = "";

            // Since you used .toUpperCase(), you only need to check for "CREDIT"
            if (statusValue === "CREDIT" || statusValue === "Credit" ) {
              rowTextColorStyle = "color: red;";
              Balance = amount - cnamount;
              tr.setAttribute('data-balance', Balance);
            }else if (statusValue === "PAID" || statusValue === "Paid" ) {
              rowTextColorStyle = "color: green;";
              Balance = parseFloat(row.GrandTotal || 0).toFixed(2);
              tr.setAttribute('data-balance', Balance);
            }
            else{
              //  rowTextColorStyle = "color: red;";
               Balance = parseFloat(row.GrandTotal || 0).toFixed(2);
               tr.setAttribute('data-balance', Balance);
            }

            // Inject the style attribute ONLY if rowTextColorStyle has a value (is "CREDIT")
            if (rowTextColorStyle) {
              tr.setAttribute("style", rowTextColorStyle);
              
            }

          // Populate the row with table data cells
          tr.innerHTML = `
            <td style="font-size: 14px; font-weight: bold; text-align: center;">${row.InvoiceNo}</td>
            <td style="font-size: 14px; font-weight: bold; text-align: center;">${formatToDdMMMyyyy(row.InvoiceDate)}</td>
            <td style="font-size: 14px; font-weight: bold; text-align: right;">${parseFloat(row.GrandTotal || 0).toFixed(2)}</td>
            <td style="font-size: 14px; font-weight: bold; text-align: right;">${row.CNAmount ? parseFloat(row.CNAmount).toFixed(2) : ""}</td>
            <td style="font-size: 14px; font-weight: bold; text-align: right;">${parseFloat(Balance || 0).toFixed(2)}</td>
            <td style="font-size: 14px; font-weight: bold; text-align: center;">${row.CreditDate ? formatToDdMMMyyyy(row.CreditDate) : ""}</td>
            <td style="font-size: 14px; font-weight: bold; text-align: center;">${row.CNNumber || ""}</td>
            <td style="font-size: 14px; font-weight: bold; text-align: center;">${row.CNStatus || ""}</td>
            <td style="font-size: 14px; font-weight: bold; text-align: right;">${row.CNPaid ? parseFloat(row.CNPaid).toFixed(2) : ""}</td>
            <td style="font-size: 14px; font-weight: bold; text-align: center;">${row.PaymentType || ""}</td>
            <td style="font-size: 14px; font-weight: bold; text-align: center;">${row.LPONo}</td>

          `;
      
      // Append the row to the tbody
      multiTable.appendChild(tr);
    });
        const InvAllCount = document.getElementById('multipayment-inv-count');
        const Allrow = multiTable.querySelectorAll('tbody tr');
        InvAllCount.value = Allrow.length;
      document.getElementById("multipayment-modal-overlay").style.display = "flex";
    })//then end
  
      .catch((err) => {
            console.error("Failed to load invoice items mapping: ", err,);
            alert("Network timeout syncing data values.");
            });
            setTimeout(() => { document.getElementById("multipayment-modal-overlay").focus(); }, 80); }
//#endregion
//#region     PAY TYPE SELECTION MULTI INVOICE PAYMENT
document.getElementById("multipayment-mode-select").addEventListener("change", function(e) {
                  toggleTypeMulti(e.target.value);
                });
                function toggleTypeMulti(paymentMode) {
                const chequeNo = document.getElementById("multipayment-chq-no");
                const chequeDate = document.getElementById("multipayment-date-input");
                const bankName = document.getElementById("multipayment-bank");
                if (paymentMode === "Cheque"|| paymentMode === "PDC") {
                  chequeNo.disabled = false;
                  chequeNo.required = true;

                  chequeDate.disabled = false;
                  chequeDate.required = true;

                  bankName.disabled = false;
                  chequeNo.focus();
                }else if (paymentMode === "Bank Transfer" || paymentMode === "Bank Deposit"|| paymentMode === "Bank Card") {
                  chequeNo.disabled = false;
                  chequeNo.required = false;
                  
                  chequeDate.disabled = true;
                  chequeDate.required = false;
                  bankName.disabled = true;
                  chequeNo.focus();
                  chequeNo.value = " ";
                  
                } else {
                  chequeNo.disabled = true;
                  chequeDate.disabled = true;
                  bankName.disabled = true;
                  chequeDate.required = false;
                  chequeNo.required = false;
                  chequeNo.value = "";
                }
              }
//#endregion=== ENDS PAY TYPE SELECTION MULTI INVOICE PAYMENT
//#endregion=====ALL INVOICE PAYMENT CODES ENDS===========

//#region  PDC MODAL TABLE CODES 📌
//#region     FETCH PDC MODAL TABLE
 function FetchPdcClearModal() {
                const cleanChq = String(activeSelectedChqNo).replace(/<[^>]*>/g, "").trim();
                const payload = {
                  cleanChqNo: cleanChq,
                  Customer: activeSelectedCustomer

                  //timeRange: document.getElementById("dash-filter-range").value
                };
                
                //console.log(payload)
                fetch("/api/pdc-overdue",{
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                }) // Replace with your actual backend endpoint URL
                .then(response => response.json())
                .then(data => {
          
                     rowTable.innerHTML = "";
              if (!data.pdcOverdue || data.pdcOverdue.length === 0) {
                alert("No PDC overdue Invoices for Customer: " + (activeSelectedCustomer || "No records found."));
                return; // This will successfully exit your main function
                }
                     // 1. 🎯 LOCK THE PARENT SIDEBAR AND GLOBAL WINDOW REFRESH
                  if (window.parent && window.parent.lockSidebarAndRefresh) {window.parent.lockSidebarAndRefresh(true);}
                  // 2. 🎯 LOCK REFRESH KEYS LOCALLY INSIDE THE IFRAME AS WELL
                  window.addEventListener("keydown", localIframeBlockRefresh);
            // Loop through each database record
            
            data.pdcOverdue.forEach(row => {
          //console.log("DEBUG: PDC Overdue Data Response:", row.invNumber);

          const tr = document.createElement('tr');
          // ADD THIS: Attach data attributes for your tooltip listener to read
            tr.setAttribute('data-type', 'invoices-rows');
            tr.setAttribute('data-customer', row.customer); // Make sure 'CustomerName' matches your DB field name
            tr.setAttribute('data-emirate', row.emirate);
            tr.setAttribute('data-invoice', row.invNumber);
            tr.setAttribute('data-amount', row.GrandTotal);
            tr.setAttribute('data-pdc', row.ChqNo);
            tr.setAttribute('data-paydate', row.issueDate);
            tr.setAttribute('data-invoicedate', row.invoiceDate);

          //      document.getElementById('pdcclear-customer').value = row.customer;
          //   document.getElementById('pdcclear-emirate').value = 'data-emirate';
          //  document.getElementById("pdcclear-modal-title").innerText ="PDC INVOICE CLEAR - " + "data-customer" + "- CHEQUE # - " + "data-pdc";

      
      // Populate the row with table data cells
      tr.innerHTML = `
        <td><input type="checkbox" class="row-select"></td>
        <td style="font-size: 14px; font-weight: bold; color: blue; text-align: center;">${formatToDdMMMyyyy(row.issueDate)}</td>
        <td style="font-size: 14px; font-weight: bold; color: blue; text-align: center;">${row.ChqNo}</td>
        <td style="font-size: 14px; font-weight: bold; color: blue; text-align: right;">${parseFloat(row.GrandTotal || 0).toFixed(2)}</td>
        <td style="font-size: 14px; font-weight: bold; color: blue; text-align: center;">${formatToDdMMMyyyy(row.invoiceDate)}</td>
        <td style="font-size: 14px; font-weight: bold; color: blue; text-align: center;">${row.invNumber}</td>
        
        
        
        
      `;
      
      // Append the row to the tbody
      rowTable.appendChild(tr);
    });

      document.getElementById("pdcclear-modal-overlay",).style.display = "flex";
    })//then end
  
      .catch((err) => {
            console.error("Failed to load invoice items mapping: ", err,);
            alert("Network timeout syncing data values.");
            });
            setTimeout(() => { document.getElementById("pdcclear-modal-overlay").focus(); }, 80); }
//#endregion
//#region     PDC CLEAR MODAL TABLE ITEMS SELECTION CODE =====//
      const table = document.getElementById('pdcclear-invoice-table');
      const totalDisplay = document.getElementById('pdcclear-grand-total');
      const selectedChequeDisplay = document.getElementById('pdcclear-pdc-no');
      const invoiceCount = document.getElementById('pdcclear-count');
      const updatePdc = document.getElementById('btn-update-pdcclear');
      const amountWord = document.getElementById('pdcclear-amount-in-words');
      const nameCustomer = document.getElementById('pdcclear-customer');
      const nameEmirate = document.getElementById('pdcclear-emirate');
      const nameHeader = document.getElementById('pdcclear-modal-title');
      // 1. Function to calculate the total amount of all checked items document.getElementById('pdcclear-customer').value = row.customer;
      function updateTotalAmount() {
        let total = 0;
  
        // Find all unique rows that are currently marked as selected
        const selectedRows = table.querySelectorAll('tbody tr.selected-row');
        
        selectedRows.forEach(row => {
          const amount = parseFloat(row.getAttribute('data-amount')) || 0;
          total += amount;
        });

        // Format the number to 2 decimal places
        const amountInWords = toWordsConfig.convert(total);
        amountWord.value = amountInWords;
        totalDisplay.value = `${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }

        // 2. Event listener for row clicks
        table.querySelector('tbody').addEventListener('click', function(e) {
          // Find the closest row element that was clicked
          const row = e.target.closest('tr');
          if (!row || row.classList.contains('disabled-row')) return;

          const checkbox = row.querySelector('.row-select');
          const chequeNumber = row.getAttribute('data-pdc');
          const customerName = row.getAttribute('data-customer');
          const customerEmirate = row.getAttribute('data-emirate');
          if (!chequeNumber || !checkbox) return;

          // Determine the target state. 
          // If the user clicked the checkbox directly, use its current state.
          // If they clicked the row, toggle what the checkbox state WAS.
          let targetCheckedState = (e.target === checkbox) ? checkbox.checked : !checkbox.checked;
          // Find all rows sharing this cheque number
          const matchingRows = table.querySelectorAll(`tr[data-pdc="${chequeNumber}"]`);
        //console.log(`Toggling ${matchingRows.length} rows for cheque number: ${chequeNumber} to ${targetCheckedState ? 'checked' : 'unchecked'}`);
          // Batch update all rows in the group
          
          if (targetCheckedState) {
            nameCustomer.value = customerName;
            nameEmirate.value = customerEmirate;
            nameHeader.innerText = `${customerName} - CHEQUE # - ${chequeNumber}`;
            selectedChequeDisplay.value = chequeNumber;
            invoiceCount.value = matchingRows.length;
            updatePdc.classList.remove('disabled');
          }else {
            nameCustomer.value = '';
            nameEmirate.value = '';
            nameHeader.innerText = 'PDC INVOICE CLEAR';
            selectedChequeDisplay.value = `-`;
            invoiceCount.value = `0;`;
            updatePdc.classList.add('disabled');
          }
          matchingRows.forEach(matchingRow => {
            const box = matchingRow.querySelector('.row-select');
            if (box) box.checked = targetCheckedState;

            if (targetCheckedState) {
              matchingRow.classList.add('selected-row');
            } else {
              matchingRow.classList.remove('selected-row');
            }
          });
        // 3. LOCK/UNLOCK Logic for different cheque numbers
          // Check if there is still at least one active selection in the table
          const staticActiveSelection = table.querySelector('tbody tr.selected-row');
          const allRows = table.querySelectorAll('tbody tr');

            allRows.forEach(currentRow => {
              const currentCheque = currentRow.getAttribute('data-pdc');
              const currentBox = currentRow.querySelector('.row-select');
              if (staticActiveSelection) {
                // If a group is selected, disable everything that doesn't match its cheque number
                if (currentCheque !== chequeNumber) {
                  currentRow.classList.add('disabled-row');
                  if (currentBox) currentBox.disabled = true;
                }
              } else {
                // If nothing is selected at all, re-enable every row in the table
                currentRow.classList.remove('disabled-row');
                if (currentBox) currentBox.disabled = false;
              }
            });
                const SelectionInv = table.querySelectorAll('tbody tr.selected-row');
            // 2. Convert the HTML rows directly into a single array of strings
                selectedInvoices = Array.from(SelectionInv).map(SelectedRow => {
                return SelectedRow.getAttribute('data-invoice'); 
                });
              // console.log(selectedInvoices);
            // Recalculate totals after updating states
            updateTotalAmount();
                      
                    //   document.getElementById('pdcclear-emirate').value = 'data-emirate';
                    //  document.getElementById("pdcclear-modal-title").innerText ="PDC INVOICE CLEAR - " + "data-customer" + "- CHEQUE # - " + "data-pdc";
          });

            document.getElementById("btn-update-pdcclear").addEventListener("click", () => {
            // PDCtitle.textContent = selectedInvoices.join(", ");
            // Safety check: Don't send an empty request
            if (selectedInvoices.length === 0) {
                alert("Please select at least one invoice.");
                return;
            }

            // 2. Send the data to your backend API route
            fetch('/api/update-pdc-status', { // Replace with your actual backend URL
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    invoiceIds: selectedInvoices,
                    status: 'Paid' // or whatever status you want to set
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(`Invoices ${selectedInvoices.join(", ")} Successfully marked as Paid!`);
                    amountWord.value = '';
                    totalDisplay.value = '0.00';
                    nameCustomer.value = '';
                    nameEmirate.value = '';
                    nameHeader.innerText = 'PDC INVOICE CLEAR';
                    selectedChequeDisplay.value = `-`;
                    invoiceCount.value = `0;`;
                    updatePdc.classList.add('disabled');
                    // Optional: Reload the table data or update row UI styles here
                    FetchPdcClearModal(); // Refresh the dashboard metrics and table
                    fetchFilteredInvoices();
                } else {
                    alert("Database update failed: " + data.message);
                }
            })
            .catch(error => {
                console.error("Network Error:", error);
            });

            });
    
//#endregion ===  PDC TABLE ITEMS UPDATE AND SELECTION CODE =====
//#endregion=====PDC MODAL TABLE ENDS===========

//#region  CASH-CHEQUE RECEIPT ALL CODES 📌
//#region     CASH-CHEQUE SINGLE RECEIPT TYPE SELECTION AND CREATE
 document.getElementById("receipt-type-select").addEventListener("change", function(e) {
                  toggleTypeInput(e.target.value);
                });
                function toggleTypeInput(paymentMode) {
                const chequeNo = document.getElementById("receipt-chqno");
                const chequeDate = document.getElementById("receipt-chqdate");
                const bankName = document.getElementById("receipt-bank");
                if (paymentMode === "Cheque") {
                  chequeNo.disabled = false;
                  chequeNo.required = true;

                  chequeDate.disabled = false;
                  chequeDate.required = true;

                  bankName.disabled = false;
                  chequeNo.focus();
                }else if (paymentMode === "Bank Transfer" || paymentMode === "Bank Deposit") {
                  chequeNo.disabled = false;
                  chequeNo.required = false;
                  
                  chequeDate.disabled = true;
                  chequeDate.required = false;
                  bankName.disabled = true;
                  chequeNo.focus();
                  chequeNo.value = " ";
                  
                } else {
                  chequeNo.disabled = true;
                  chequeDate.disabled = true;
                  bankName.disabled = true;
                  chequeDate.required = false;
                  chequeNo.required = false;
                  chequeNo.value = "";
                }
              }
  //====================== Create Receipts =================================//  
              const receiptBtn = document.getElementById("receipt-btn-update"); // Replace with your actual button ID
              const chqNo = document.getElementById("receipt-chqno");

                function openReceiptGenerationWorkflow() {
                // 1. Gather properties directly from your global tracking variables
                const customerName = activeSelectedCustomer || "Cash";
                const emirate = activeSelectedEmirate;
                const invoiceNo = activeSelectedInvoiceNo;
                const invoiceDate = activeSelectedInvDate;
                const receiptDate = document.getElementById("receipt-date").value;
                const receiptType = document.getElementById("receipt-type-select").value;
                const chqNo = document.getElementById("receipt-chqno").value;
                const chqDate = document.getElementById("receipt-chqdate").value;
                const bankName = document.getElementById("receipt-bank").value;
                const inWords = activeSelectedInwords;
                
                // Choose active Balance if current invoice is partially cleared, else grab original Grand total
                const balance = parseFloat(activeSelectedBalance);
                const grandTotal = parseFloat(activeSelectedAmount);
                const finalAmount = (!isNaN(balance) && balance > 0) ? balance : grandTotal;

                if (!invoiceNo) {
                    alert("No active invoice selected from context menu.");
                    return;
                }
                // Build your request data parameters
                const params = new URLSearchParams({
                    customerName,
                    emirate,
                    invoiceNo,
                    invoiceDate,
                    receiptDate,
                    receiptType,
                    chqNo,
                    chqDate,
                    bankName,
                    inWords,
                    amount: finalAmount
                });

              // Open the real API endpoint URL directly in a new tab with the zoom parameter appended
              window.open(`/api/generate-receipt-pdf?${params.toString()}#zoom=100`, '_blank');

              //==============================
                         // Unlock page mechanisms and close main modal here
                  window.removeEventListener("keydown", localIframeBlockRefresh);
                  if (window.parent && window.parent.lockSidebarAndRefresh) {
                      window.parent.lockSidebarAndRefresh(false);
                  }
                        // HIDE Modal overlay
                  document.getElementById("receipt-modal-overlay",).style.display = "none";
                  document.getElementById('receipt-transaction-form').reset();

             }

             // BUTTON CLICK EVENT
              receiptBtn.addEventListener("click", function (e) {
                  const currentMode = document.getElementById("receipt-type-select").value;
                  toggleTypeInput(currentMode);
              if (chqNo.required && chqNo.value.trim() === "") {
                alert("Please enter the Cheque Number.");
                chqNo.focus(); // Drop the user's cursor right into the missing input field
                return; // STOP execution here so it doesn't submit blank data!
              }
                  e.preventDefault();
                  openReceiptGenerationWorkflow();
            });
//#endregion
//#region     FETCH MULTI INVOICE RECEIPT MODAL TABLE 
 function  FetchMutltiInvoiceReceipt() {
                let Balance = 0;
                const multiTable = document.getElementById('multireceipt-modal-items-rows');
                // const cleanChq = String(activeSelectedChqNo).replace(/<[^>]*>/g, "").trim();
                const payload = {
                  // cleanChqNo: cleanChq,
                  Customer: activeSelectedCustomer

                  //timeRange: document.getElementById("dash-filter-range").value
                };
                
                //console.log(payload)
                fetch("/api/multi-invoice-receipt",{
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                }) // Replace with your actual backend endpoint URL
                .then(response => response.json())
                .then(data => {          
                multiTable.innerHTML = "";

              if (!data.multiInvoice || data.multiInvoice.length === 0) {
                alert("No Pending Invoices for Customer: " + (activeSelectedCustomer || "No records found."));
                return; // This will successfully exit your main function
                }

                 
                     // 1. 🎯 LOCK THE PARENT SIDEBAR AND GLOBAL WINDOW REFRESH
                  if (window.parent && window.parent.lockSidebarAndRefresh) {window.parent.lockSidebarAndRefresh(true);}
                  // 2. 🎯 LOCK REFRESH KEYS LOCALLY INSIDE THE IFRAME AS WELL
          window.addEventListener("keydown", localIframeBlockRefresh);
                  const rawMode = "Cash";
                      // Loop through each database record
                      document.getElementById("multireceipt-modal-title").innerText ="RECEIPT FOR - " + activeSelectedCustomer;
                      document.getElementById("multireceipt-customer").value = activeSelectedCustomer || "";
                      document.getElementById("multireceipt-emirate").value = activeSelectedEmirate || "ABU DHABI";
                      document.getElementById("multireceipt-date-input").value = formattedDate;
                      document.getElementById("multireceipt-chq-date").value = formattedDate;
                      document.getElementById("multireceipt-mode-select").value = rawMode || "Cash";
                      const ChqIn = document.getElementById("multireceipt-chqno");
                      // ChqIn.style.display = "none";    
                      
               
            
          data.multiInvoice.forEach(row => {
          const tr = document.createElement('tr');
          // ADD THIS: Attach data attributes for your tooltip listener to read
            tr.setAttribute('data-type', 'invoices-rows');
            // tr.setAttribute('data-customer', row.customer); // Make sure 'CustomerName' matches your DB field name
            // tr.setAttribute('data-emirate', row.Emirate);
            tr.setAttribute('data-invoice', row.InvoiceNo);
            tr.setAttribute('data-cn', row.CNNumber);
            tr.setAttribute('data-amount', row.GrandTotal);
            tr.setAttribute('data-cnamount', row.CNAmount);
            tr.setAttribute('data-lpo', row.LPONo);
            tr.setAttribute('data-creditdate', row.CreditDate);
            tr.setAttribute('data-invoicedate', row.InvoiceDate);
            

            const amount = parseFloat(tr.getAttribute('data-amount')) || 0;
            const cnamount = parseFloat(tr.getAttribute('data-cnamount')) || 0;
            // Balance = amount - cnamount;

            const statusValue = (row.Status);
            let rowTextColorStyle = "";

            // Since you used .toUpperCase(), you only need to check for "CREDIT"
            if (statusValue === "Pending" || statusValue === "PENDING" ) {
              rowTextColorStyle = "color: red;";
              Balance = amount - cnamount;
              tr.setAttribute('data-balance', Balance);
            }else if (statusValue === "PAID" || statusValue === "Paid" ) {
              rowTextColorStyle = "color: green;";
              Balance = parseFloat(row.GrandTotal || 0).toFixed(2);
              tr.setAttribute('data-balance', Balance);
            }
            else{
              //  rowTextColorStyle = "color: red;";
               Balance = parseFloat(row.GrandTotal || 0).toFixed(2);
               tr.setAttribute('data-balance', Balance);
            }

            // Inject the style attribute ONLY if rowTextColorStyle has a value (is "CREDIT")
            if (rowTextColorStyle) {
              tr.setAttribute("style", rowTextColorStyle);
              
            }

          // Populate the row with table data cells
          tr.innerHTML = `
            <td style="font-size: 14px; font-weight: bold; text-align: center;">${row.InvoiceNo}</td>
            <td style="font-size: 14px; font-weight: bold; text-align: center;">${formatToDdMMMyyyy(row.InvoiceDate)}</td>
            <td style="font-size: 14px; font-weight: bold; text-align: right;">${parseFloat(row.GrandTotal || 0).toFixed(2)}</td>
            <td style="font-size: 14px; font-weight: bold; text-align: right;">${row.CNAmount ? parseFloat(row.CNAmount).toFixed(2) : ""}</td>
            <td style="font-size: 14px; font-weight: bold; text-align: right;">${parseFloat(Balance || 0).toFixed(2)}</td>
            <td style="font-size: 14px; font-weight: bold; text-align: center;">${row.CreditDate ? formatToDdMMMyyyy(row.CreditDate) : ""}</td>
            <td style="font-size: 14px; font-weight: bold; text-align: center;">${row.CNNumber || ""}</td>
            <td style="font-size: 14px; font-weight: bold; text-align: center;">${row.CNStatus || ""}</td>
            <td style="font-size: 14px; font-weight: bold; text-align: right;">${row.CNPaid ? parseFloat(row.CNPaid).toFixed(2) : ""}</td>
            <td style="font-size: 14px; font-weight: bold; text-align: center;">${row.PaymentType || ""}</td>
            <td style="font-size: 14px; font-weight: bold; text-align: center;">${row.LPONo}</td>
            <td class="row-status" style="font-size: 14px; font-weight: bold; text-align: center;">${row.Status}</td>

          `;
      
      // Append the row to the tbody
      multiTable.appendChild(tr);
    });
        const InvAllCount = document.getElementById('multireceipt-inv-count');
        const Allrow = multiTable.querySelectorAll('tbody tr');
        InvAllCount.value = Allrow.length;
      document.getElementById("multireceipt-modal-overlay").style.display = "flex";
    })//then end
  
      .catch((err) => {
            console.error("Failed to load invoice items mapping: ", err,);
            alert("Network timeout syncing data values.");
            });
            setTimeout(() => { document.getElementById("multireceipt-modal-overlay").focus(); }, 80); }
//#endregion
//#region     LEFT CLICK SELECTION MULTI INVOICE RECEIPT
  // ⚡ LEFT-CLICK MULTI-SELECTION LISTENER
            document.getElementById("multireceipt-modal-items-rows").addEventListener("click", function (e) {
              const clickedRow = e.target.closest("tr");             
              // Exit if clicking outside a row, or if clicking an input text box/button inside the row
              if (!clickedRow || e.target.tagName === "INPUT" || e.target.tagName === "BUTTON") return;            
              // 💡 TOGGLE SELECTION ON LEFT-CLICK: Adds/removes orange/blue highlight class
              clickedRow.classList.toggle("row-selected-for-cn");
              updateMultiReceiptAmount();              
            });

            // ⚡ FUNCTION: TOGGLE SELECTION ON VISIBLE ROWS ONLY
            function toggleSelectAllVisibleRows(buttonElement) {
              const allRows = document.querySelectorAll("#multireceipt-modal-items-rows tr");
              const visibleRows = Array.from(allRows).filter(row => row.style.display !== "none");
              
              if (visibleRows.length === 0) return;

              const visibleSelectedRows = visibleRows.filter(row => row.classList.contains("row-selected-for-cn"));
              const isAllVisibleSelected = visibleRows.length === visibleSelectedRows.length;

              visibleRows.forEach(row => {
                if (isAllVisibleSelected) {
                  row.classList.remove("row-selected-for-cn");
                } else {
                  row.classList.add("row-selected-for-cn");
                }
              });

              // Sync everything after selection changes
              updateMultiReceiptAmount();
              updateSelectAllButtonText(buttonElement, allRows);
            }

            // ⚡ HELPER FUNCTION: UPDATE BUTTON TEXT ACCURATELY
            function updateSelectAllButtonText(buttonElement, allRows) {
              if (!buttonElement) return;
              
              const visibleRows = Array.from(allRows).filter(row => row.style.display !== "none");
              if (visibleRows.length === 0) {
                buttonElement.textContent = "Select All";
                return;
              }

              const visibleSelectedRows = visibleRows.filter(row => row.classList.contains("row-selected-for-cn"));
              const isAllVisibleSelected = visibleRows.length === visibleSelectedRows.length;
              
              buttonElement.textContent = isAllVisibleSelected ? "Deselect All" : "Select All";
            }


            // ⚡ BUTTON MULTI-SELECTION LISTENER
            document.getElementById("multireceipt-btn-selectall").addEventListener("click", function () {
              toggleSelectAllVisibleRows(this);
            });


            // ⚡ CHECKBOX EVENT LISTENER (WITH AUTOMATIC DESELECTION)
            document.getElementById("multireceipt-pending").addEventListener("change", function () {
              const isChecked = this.checked;
              const allRows = document.querySelectorAll("#multireceipt-modal-items-rows tr");
              const selectAllBtn = document.getElementById("multireceipt-btn-selectall");

              allRows.forEach(row => {
                if (isChecked) {
                  const statusCell = row.querySelector(".row-status"); // Update with your actual class
                  const statusText = statusCell ? statusCell.textContent.trim().toLowerCase() : "";

                  if (statusText !== "pending") {
                    row.style.display = "none";
                    // 🌟 KEY FIX: Remove selection from rows that are being hidden
                    row.classList.remove("row-selected-for-cn"); 
                  } else {
                    row.style.display = "";
                  }
                } else {
                  row.style.display = "";
                }
              });

              // 🌟 RE-RUN CALCULATION: Recalculates amount and text fields using only active selections
              updateMultiReceiptAmount();

              // Update button text to match the remaining visible rows
              updateSelectAllButtonText(selectAllBtn, allRows);
            });



            const btnMultiUpdate = document.getElementById('btn-update-multireceipt');
            const multiReceiptTable = document.getElementById('multireceipt-invoice-table');
            const totalMultiAmt = document.getElementById('multireceipt-grand-total');
            const totalMultiWord = document.getElementById('multireceipt-amount-in-words');
            const InvMultiCount = document.getElementById('multireceipt-count');
            const CnMultiTotal = document.getElementById('multireceipt-cnamount');
            const MultiGTotal = document.getElementById('multireceipt-grandtotal');

             document.getElementById("multireceipt-mode-select").addEventListener("change", function(e) {
                  toggleMultiInput(e.target.value);
                });
                function toggleMultiInput(paymentMode) {
                const chequeNo = document.getElementById("multireceipt-chqno");
                const chequeDate = document.getElementById("multireceipt-chq-date");
                const bankName = document.getElementById("multireceipt-bank");
                if (paymentMode === "Cheque") {
                  chequeNo.disabled = false;
                  chequeNo.required = true;

                  chequeDate.disabled = false;
                  chequeDate.required = true;

                  bankName.disabled = false;
                  chequeNo.focus();
                }else if (paymentMode === "Bank Transfer" || paymentMode === "Bank Deposit") {
                  chequeNo.disabled = false;
                  chequeNo.required = false;
                  
                  chequeDate.disabled = true;
                  chequeDate.required = false;
                  bankName.disabled = true;
                  chequeNo.focus();
                  chequeNo.value = " ";
                  
                } else {
                  chequeNo.disabled = true;
                  chequeDate.disabled = true;
                  bankName.disabled = true;
                  chequeDate.required = false;
                  chequeNo.required = false;
                  chequeNo.value = "";
                }
              }
            
            function updateMultiReceiptAmount() {
              let Multitotal = 0;
              let Multicntotal = 0;
              let MultiBaltotal = 0;
              // Find all unique rows that are currently marked as selected
              const selectedMultiRows = multiReceiptTable.querySelectorAll('tbody tr.row-selected-for-cn');
              
              selectedMultiRows.forEach(row => {
                const MultiBalamount = parseFloat(row.getAttribute('data-balance')) || 0;
                const Multiamount = parseFloat(row.getAttribute('data-amount')) || 0;
                const Multicnamount = parseFloat(row.getAttribute('data-cnamount')) || 0;
                Multitotal += Multiamount;
                MultiBaltotal += MultiBalamount;
                Multicntotal += Multicnamount;
              });

              // Format the number to 2 decimal places
              const MultiactualPay = MultiBaltotal;
              // const MultiactualPay = total - cntotal;
              const MultiamountInWords = toWordsConfig.convert(MultiactualPay);
              totalMultiWord.value = MultiamountInWords;
              MultiGTotal.value = `${Multitotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              // totalMultiAmt.value = `${MultiactualPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              totalMultiAmt.value = parseFloat(MultiactualPay).toFixed(2);
              InvMultiCount.value = selectedMultiRows.length;
              CnMultiTotal.value = `${Multicntotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              if(selectedMultiRows.length > 0){
                btnMultiUpdate.classList.remove('disabled');
              }
              else{
                btnMultiUpdate.classList.add('disabled');
              }
            }
//#endregion
//#region     CASH-CHEQUE MULTI CREATE RECEIPT 

  //====================== Create Receipts =================================//  
              const multiReceiptBtn = document.getElementById("btn-update-multireceipt"); // Replace with your actual button ID
              const selectAllBtn = document.getElementById("multireceipt-btn-selectall");
                const chequeNo = document.getElementById("multireceipt-chqno");
                const chequeDate = document.getElementById("multireceipt-chq-date");
                const bankName = document.getElementById("multireceipt-bank");
              // const multichqNo = document.getElementById("multireceipt-chqno");        
          function openMultiReceiptGenerationWorkflow() {
              const multitableReceipt = document.getElementById('multireceipt-invoice-table');
              const multiSelectionInv = multitableReceipt.querySelectorAll('tbody tr.row-selected-for-cn');
            
              const multiselectedItems = Array.from(multiSelectionInv).map(SelectedRow => {
                  return {
                      SrNo: "",
                      InvoiceNo: parseInt(SelectedRow.getAttribute('data-invoice'), 10),
                      InvoiceDate: SelectedRow.getAttribute('data-invoicedate'),
                      LPONo: SelectedRow.getAttribute('data-lpo'),
                      GrandTotal: parseFloat(SelectedRow.getAttribute('data-amount')),
                      CNAmount: parseFloat(SelectedRow.getAttribute('data-cnamount')),
                      Balance: parseFloat(SelectedRow.getAttribute('data-balance')),                      
                  };
              });

              if (multiselectedItems.length === 0) {
                  alert("Please select at least ones invoice.");
                  return;
              } 

              // Gather form values
              const multicustomerName = activeSelectedCustomer || "Cash";
              const multiemirate = activeSelectedEmirate;
              const multiinvoiceCount = document.getElementById("multireceipt-count").value;
              const multireceiptDate = document.getElementById("multireceipt-date-input").value;
              const multichqNo = document.getElementById("multireceipt-chqno").value;
              const multireceiptType = document.getElementById("multireceipt-mode-select").value;
              const multichqDate = document.getElementById("multireceipt-chq-date").value;
              const multibankName = document.getElementById("multireceipt-bank").value;
              const multiinWords = document.getElementById("multireceipt-amount-in-words").value;
              const finalAmount = document.getElementById("multireceipt-grand-total").value;
              const multifinalAmount = parseFloat(finalAmount).toFixed(2);

              // CRITICAL FIX: Create a temporary HTML form to trigger a POST request in a new tab
              const form = document.createElement('form');
              form.method = 'POST';
              // Sanitize the customer name to ensure it's safe for filenames
              const safeCustomerName = multicustomerName.replace(/[^a-zA-Z0-9-_ ]/g, '').trim();
              const targetFilename = `${safeCustomerName || 'Customer'}.pdf`;
              // form.action = '/api/generate-multi-receipt-pdf#zoom=100'; // Target URL
              form.action = `/api/generate-multi-receipt-pdf/${targetFilename}#zoom=100`; 
              form.target = '_blank'; // Force open in new tab

              

              // Package all variables as hidden inputs
              const payload = {
                  multiselectedItems: JSON.stringify(multiselectedItems), // Stringify just like before
                  multiinvoiceCount,
                  multicustomerName,
                  multiemirate,
                  multireceiptDate,
                  multireceiptType,
                  multichqNo,
                  multichqDate,
                  multibankName,
                  multiinWords,
                  multifinalAmount,
                  filename: targetFilename // <-- CRITICAL: Send the file name to the server
              };

              // Append payload entries to the form
              for (const [key, value] of Object.entries(payload)) {
                  const hiddenField = document.createElement('input');
                  hiddenField.type = 'hidden';
                  hiddenField.name = key;
                  hiddenField.value = value;
                  form.appendChild(hiddenField);
              }

              // Submit and clean up the form element
              document.body.appendChild(form);
              form.submit();
              document.body.removeChild(form);

              //==============================
              // Unlock page mechanisms and close main modal here
              window.removeEventListener("keydown", localIframeBlockRefresh);
              if (window.parent && window.parent.lockSidebarAndRefresh) {
                  window.parent.lockSidebarAndRefresh(false);
              }
              // HIDE Modal overlay
              selectAllBtn.textContent = "Select All";
              multiReceiptBtn.classList.add("disabled");
              chequeNo.disabled = true;
              chequeDate.disabled = true;
              bankName.disabled = true;
              document.getElementById('multireceipt-modal-overlay').style.display = "none";
              document.getElementById('multireceipt-invoice-master-form').reset();
          }


             // BUTTON CLICK EVENT
              multiReceiptBtn.addEventListener("click", function (e) {
                  const currentMode = document.getElementById("receipt-type-select").value;
                  toggleTypeInput(currentMode);
              if (chqNo.required && chqNo.value.trim() === "") {
                alert("Please enter the Cheque Number.");
                chqNo.focus(); // Drop the user's cursor right into the missing input field
                return; // STOP execution here so it doesn't submit blank data!
              }
                  e.preventDefault();
                  openMultiReceiptGenerationWorkflow();
            });
//#endregion
//#endregion=====CASH-CHEQUE RECEIPT ENDS===========

//#region  STATEMENT OF INVOICES ALL CODES 📌

//#region     STATEMENT BUTTON CLICK CODE
            // STATEMENT BUTTON CLICK EVENT
            const statementBtn = document.getElementById("statement-btn-update");
              statementBtn.addEventListener("click", function (e) {
                  requestStatementPDF();
            });
    function requestStatementPDF() {
    const customer = document.getElementById("statement-customer").value;
    const type = document.getElementById("statement-type-select").value; 
    const fromDate = document.getElementById("statement-from-date").value;
    const toDate = document.getElementById("statement-to-date").value;
    const createDate = document.getElementById("statement-date").value;

    if (!customer || !fromDate || !toDate) {
        alert("Please ensure filtration boundaries are established before exporting.");
        return;
    }

    fetch('/api/generate-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer, type, fromDate, toDate, createDate })
    })
    .then(async response => {
        if (!response.ok) throw new Error("Server engine rejected print parameters.");
        
        // Read clean dynamic structural header title pushed down by Node server block
        const disposition = response.headers.get('content-disposition');
        let filename = 'statement.pdf';
        if (disposition && disposition.indexOf('attachment') !== -1) {
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(disposition);
            if (matches != null && matches[1]) { 
                filename = matches[1].replace(/['"]/g, '');
            }
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename; 
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    })
    .catch(err => alert("Error transferring statement payload: " + err.message));
}
//#endregion
//#region     STATEMENT DURATION SELECT CODE

// Helper function to format Date object into YYYY-MM-DD
        function formatDate(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        // Named function so it can be called from anywhere (like your context menu action)
        function updateInvoiceDatePickers() {
            const today = new Date();
            let fromDate = new Date();
            let toDate = new Date();

            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth();

            switch (durationSelect.value) {
                case "CURRENT_MONTH":
                    fromDate = new Date(currentYear, currentMonth, 1);
                    toDate = today;
                    break;
                case "LAST_MONTH":
                    fromDate = new Date(currentYear, currentMonth - 1, 1);
                    toDate = new Date(currentYear, currentMonth, 0); 
                    break;
                case "MONTHS":
                    fromDate.setMonth(today.getMonth() - 2);
                    toDate = today;
                    break;
                case "3MONTHS":
                    fromDate.setMonth(today.getMonth() - 3);
                    toDate = today;
                    break;
                case "6MONTHS":
                    fromDate.setMonth(today.getMonth() - 6);
                    toDate = today;
                    break;
                case "CURRENT_YEAR":
                    fromDate = new Date(currentYear, 0, 1);
                    toDate = today;
                    break;
                case "FULL":
                    fromDate = new Date(2022, 0, 1); // January 1st, 2022
                    toDate = today;
                    break; 
            }

            fromDateInput.value = formatDate(fromDate);
            toDateInput.value = formatDate(toDate);
        }

        // Manual validation if user clicks pickers directly
        function validateManualDates(e) {
            if (!fromDateInput.value || !toDateInput.value) {
                durationSelect.value = "full";
                return;
            }
            const fromDateVal = new Date(fromDateInput.value);
            const toDateVal = new Date(toDateInput.value);

            if (e.target === fromDateInput && fromDateVal > toDateVal) {
                toDateInput.value = fromDateInput.value;
            } else if (e.target === toDateInput && toDateVal < fromDateVal) {
                fromDateInput.value = toDateInput.value;
            }
            durationSelect.value = "full";
        }

        // Attach your global event listeners once
        if (durationSelect && fromDateInput && toDateInput) {
            durationSelect.addEventListener("change", updateInvoiceDatePickers);
            fromDateInput.addEventListener("change", validateManualDates);
            toDateInput.addEventListener("change", validateManualDates);
        }

//#endregion

//#endregion=== STATEMENT CODE ENDS
}
//#endregion INVOICES PAGE CODE ALL ENDS HERE================//

//=========================================================================================//

//===============================CREDIT NOTES=============================================//
//#region 📌 CREDIT NOTES CODE ALL INSERTED HERE

function initCreditNotesPage() {
  let TotalCN = "";

  //#region  LOAD CREDIT NOTES FROM DATABASE
              const btnCnSearch = document.getElementById("btn-cn-search");
              if (!btnCnSearch) return;               
              fetchFilteredCreditNotes();
//#endregion

//#region  CREDIT NOTE SEARCH BUTTON CLICK EVENT
             btnCnSearch.addEventListener("click", fetchFilteredCreditNotes);

              //================ SEARCH EVENTS FOR RANGE, STATUS, CREDIT NOTE NUMBER, CUSTOMER NAME ====================//
              document.getElementById("filter-cn-range").addEventListener("change", (event) => 
                {
                    document.getElementById("filter-cn-start-date").value = "";
                    document.getElementById("filter-cn-end-date").value = "";
                    fetchFilteredCreditNotes();
                });
              document.getElementById("filter-cn-status").addEventListener("change", (event) => 
                {
                  fetchFilteredCreditNotes();
                });
              // document.getElementById("search-cn-no").addEventListener("input", () => 
              //   {
              //     fetchFilteredCreditNotes();
              //   });
              document.getElementById("search-cn-customer").addEventListener("input", () => 
                {
                  fetchFilteredCreditNotes();
                });
//#endregion

//#region  FETCH CREDIT NOTES FROM DATABASE FUNCTION
              
              function fetchFilteredCreditNotes() {
                document.getElementById("cn-head").textContent = `Credit Notes Registry`;
                const cnloadingOverlay = document.getElementById("cn-loading-overlay");
                const cntableBlock = document.getElementById("cn-table-display-block");
                const cntbody = document.getElementById("cn-rows");

                cnloadingOverlay.style.display = "block";
                cntableBlock.style.opacity = "0.4";

                const payload = {
                  // CNNumber: document.getElementById("search-cn-no").value.trim(),
                  searchQuery: document.getElementById("search-cn-customer").value.trim(),
                  Status: document.getElementById("filter-cn-status").value,
                  timeRange: document.getElementById("filter-cn-range").value,
                  startDate: document.getElementById("filter-cn-start-date").value,
                  endDate: document.getElementById("filter-cn-end-date").value,
                };
                //console.log("[ERP DEBUG] Credit Notes Data Retrieved:", payload);

                fetch("/api/creditnotes", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                  
                })
                
                  .then((res) => res.json())
                  .then((data) => { 
                    // console.log("[ERP DEBUG] Credit Notes Data Retrieved:", data.creditnotes);
                    cntbody.innerHTML = "";
                    cnloadingOverlay.style.display = "none";
                    cntableBlock.style.opacity = "1.0";

                    if (
                      !data.success ||
                      !data.creditnotes ||
                      data.creditnotes.length === 0
                    ) {
                      cntbody.innerHTML =
                        '<tr><td colspan="13" class="text-center text-muted py-3">No matching credit note records found inside database registry.</td></tr>';
                      return;
                    }
                    TotalCN = "";
                    TotalCN = data.creditnotes.length;//total quotations count

                    // 1. Extract all dates and convert them to timestamps
                    const timestamps = data.creditnotes.map(creditnote => new Date(creditnote.CreditDate).getTime());
                    // 2. Find the minimum and maximum timestamps
                    const minTimestamp = Math.min(...timestamps);
                    const maxTimestamp = Math.max(...timestamps);
                    
                    document.getElementById("cn-head").innerHTML = `Credit Notes (${TotalCN})`;
                    const now = new Date();
                    document.getElementById("cn-head-date").innerHTML = formatToDdMMMyyyy(now);
                    // 💡 DYNAMICALLY UPDATE THE DATE PICKERS FOR DELIVERY ORDERS
                    if (data.computedDates.from) {
                        document.getElementById("filter-cn-start-date").value = data.computedDates.from;
                    } else {
                        document.getElementById("filter-cn-start-date").value = ""; // Clear if FULL history selection
                    }

                    if (data.computedDates.to) {
                        document.getElementById("filter-cn-end-date").value = data.computedDates.to;
                    } else {
                        document.getElementById("filter-cn-end-date").value = ""; // Clear if FULL history selection
                    }

                    
                    data.creditnotes.forEach((cn) => {
                      const row = document.createElement("tr");

                      // 2. 💡 CRITICAL FIX: Set your data markers directly onto the element object wrapper!
                      row.setAttribute('data-id', cn.ID || "");
                      row.setAttribute('data-cnno', cn.CNNumber || "");
                      let badgeClass = "text-danger";
                      let rowTextColorStyle = ""; // 🎯 Holder for row inline color styles
                      // 2. 🎨 MAP ROW TEXT COLOR DIRECTLY TO FINANCIAL REGISTRY STATUSES
                      const cnstatusValue = (cn.Status || "PENDING").toUpperCase();

                      if (cnstatusValue === "PAID") {
                        badgeClass = "bg-success";
                        rowTextColorStyle = "color: green;"; // green
                      } else if (cnstatusValue === "PENDING") {
                        badgeClass = "bg-warning text-dark";
                        rowTextColorStyle = "color: red;"; // red
                      } else if (cnstatusValue === "PDC") {
                        badgeClass = "bg-info text-dark";
                        rowTextColorStyle = "color: purple;"; // purple
                      } else if (
                        cnstatusValue === "ADV.PAID" ||
                        cnstatusValue === "ADVANCE PAID"
                      ) {
                        badgeClass = "bg-danger";
                        rowTextColorStyle = "color: blue;"; //  blue text row
                      }
                      // 3. Inject the style attribute directly into the opening <tr> element node
                      if (rowTextColorStyle) {
                        row.setAttribute("style", rowTextColorStyle);
                      }

                      row.innerHTML = `
                        
                        <td class="col-width-id">${cn.ID || "N/A"}</td> <!-- 🎯 ADDED CLASS HERE TO HIDE CELL -->
                        <td>${cn.CNNumber || "N/A"}</td>
                        <td>${formatToDdMMMyyyy(cn.CreditDate)}</td>
                        <td>${cn.LPONo?.trim() || "-"}</td>
                        <td>${cn.InvoiceNo || "N/A"}</td>
                        <td>${cn.InvoiceDate ? formatToDdMMMyyyy(cn.InvoiceDate) : ""}</td>
                        <td>${cn.Customer || "CASH"}</td>
                        <td>${cn.Emirate || "ABU DHABI"}</td>
                        <td style= "text-align: right">${parseFloat(cn.GrandTotal || 0).toFixed(2)}</td>
                        <td style= "text-align: right">${parseFloat(cn.Paid || 0).toFixed(2)}</td>
                        <td style= "text-align: right">${parseFloat(cn.Balance || 0).toFixed(2)}</td>
                        <td>${cn.Status || "Pending"}
                        <td>${cn.PaidInvNumber || ""}</td>
                        <td>${cn.PaidInvDate ? formatToDdMMMyyyy(cn.PaidInvDate) : ""}</td>
                        <td>${cn.PaymentType || "Invoice"}
                        <td>${cn.ChqNo || "-"}</td>
                        
                    `;
                      cntbody.appendChild(row);
                    });
                  })
                  .catch((err) => {
                    console.error("Critical rendering pipeline issue:", err);
                    cnloadingOverlay.style.display = "none";
                    cntableBlock.style.opacity = "1.0";
                    cntbody.innerHTML =
                      '<tr><td colspan="13" class="text-center text-danger py-3">Error streaming dataset values. Check server connection metrics.</td></tr>';
                  });
              }
              // 🎯 GLOBAL STORAGE TRACKER FOR THE ACTIVE SELECTED CREDIT NOTE DATA
              let activeSelectedCreditNoteNo = null;
              let activeSelectedCreditNoteId = null;
              
//#endregion

//#region  BUTTON CREDIT NOTE RESET CLICK EVENT
              document.getElementById("btn-cn-reset").addEventListener("click", () => 
                {
                  // document.getElementById("search-cn-no").value = "";
                  document.getElementById("search-cn-customer").value = "";
                  document.getElementById("filter-cn-status").value = "ALL";
                  document.getElementById("filter-cn-range").value = "3MONTH";
                  document.getElementById("filter-cn-start-date").value = "";
                  document.getElementById("filter-cn-end-date").value = "";
                  fetchFilteredCreditNotes();
                });
//#endregion ============ END BUTTON RESET CLICK EVENT ===================================//

//#region  OPEN CREDIT NOTES DYNAMIC CONTEXT MENU
              document.getElementById("cn-rows").addEventListener("contextmenu", function (e) {
                  const clickedRow = e.target.closest("tr");
                  if (!clickedRow) return;
                  // const cells = clickedRow.getElementsByTagName("td");
                  // if (!cells || cells.length < 13) return; // Ignore loose spaces or empty rows
                  e.preventDefault();
                  // ⚡ INSTANT READ: Bypasses innerText geometry checks completely!
                  activeSelectedCreditNoteId = clickedRow.getAttribute("data-id") || "";
                  activeSelectedCreditNoteNo = clickedRow.getAttribute("data-cnno") || "";
                  //console.log(`[ERP DEBUG] Fast Lock: ${activeSelectedCreditNoteNo}`);
                  // 🎯 THE FRONTEND FIX: Read InvoiceNo directly out of index cell 1
                  // Index 0 is hidden ID, Index 1 is Invoice Number string
                  // activeSelectedInvoiceId = cells[0].innerText.trim() || cells[0].textContent.trim();
                  // activeSelectedInvoiceNo = cells[1].innerText.trim() || cells[1].textContent.trim();
                  // Clean any trailing tags or line breaks from the invoice number string
                  activeSelectedCreditNoteNo = activeSelectedCreditNoteNo.replace(/<[^>]*>/g, "").trim();
                  //console.log(`[ERP DEBUG] Fast Lock: ${activeSelectedCreditNoteNo}`);
                // ⚡ OPTIMIZATION 1: Clear ONLY the single previously highlighted row instead of looping through all rows
                const oldHighlightedRow = document.querySelector("#cn-rows tr.cn-rows-highlight-context");
                if (oldHighlightedRow) {
                  oldHighlightedRow.classList.remove("cn-rows-highlight-context");
                }
                clickedRow.classList.add("cn-rows-highlight-context");

                const menuElement = document.getElementById("cn-context-menu");
                // ⚡ OPTIMIZATION 2: Pre-set display styles before reading geometric layout sizes
                menuElement.style.visibility = "hidden"; // Render invisibly first so it takes shape in the DOM
                menuElement.style.display = "block";


                  // Highlight row visually
                  // document.querySelectorAll("#invoice-rows tr").forEach((row) => row.classList.remove("invoices-row-highlight-context"),);
                  // clickedRow.classList.add("invoices-row-highlight-context");

                  //const menuElement = document.getElementById("invoices-context-menu",);
                  
                  // menuElement.style.display = "block";
                  //menuElement.style.left = e.clientX + "px";
                  //menuElement.style.top = e.clientY + "px";
                  // 2. Get your monitor window sizes and menu sizes
                const menuWidth = menuElement.offsetWidth || 150;
                const menuHeight = menuElement.offsetHeight || 120;
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;

                // 3. Calculate ideal X (Horizontal) Position
                // If opening to the right goes off-screen, flip it to open to the left
                let targetX = e.clientX;
                if (e.clientX + menuWidth > windowWidth) {
                  targetX = windowWidth - menuWidth - 10; // 10px safety margin from window edge
                }
                
                // 4. Calculate ideal Y (Vertical) Position
                // If opening downward goes off-screen, flip it to open upward instead!
                let targetY = e.clientY;
                if (e.clientY + menuHeight > windowHeight) {
                  targetY = e.clientY - menuHeight; // Shifts the menu completely above your cursor
                  
                  // Safety check: if it hits the absolute top of the viewport
                  if (targetY < 0) targetY = 10; 
                }
                
                // 5. Apply the safe, un-clipped coordinates
                menuElement.style.left = targetX + "px";
                menuElement.style.top = targetY + "px";
                menuElement.style.visibility = "visible"; 
                e.stopPropagation();
                });

              // 🎯 HIDE MENU SCRIPT: Closes popup if user clicks anywhere else on screen
              document.addEventListener("click", function (e) {
                const menuElement = document.getElementById(
                  "cn-context-menu",
                );
                if (!e.target.closest("#cn-context-menu")) {
                  menuElement.style.display = "none";
                  document
                    .querySelectorAll("#cn-rows tr")
                    .forEach((row) =>
                      row.classList.remove("cn-rows-highlight-context"),
                    );
                }
              });
//#endregion

//#region  FORMAT DATE TO DISPLAY DD-MMM-YYYY
              function formatToDdMMMyyyy(dateString) {
                if (!dateString) return "N/A";
                const dateObj = new Date(dateString);
                if (isNaN(dateObj.getTime())) return "N/A";
                const day = String(dateObj.getDate()).padStart(2, "0");
                const yy = String(dateObj.getFullYear()).slice(-2);
                const months = [
                  "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",
                ];
                return (
                  day + "-" + months[dateObj.getMonth()] + "-" + yy
                );
              }
//#endregion ============ END FORMAT DATE TO DISPLAY DD-MMM-YYYY===================================//

//#region CREDIT NOTE EDIT / PRINT / DELETE
 const cnModal=document.getElementById('editcn-modal-overlay');
 if(cnModal){
  const cnForm=document.getElementById('editcn-note-master-form'),cnBody=document.getElementById('editcn-note-modal-items-rows'),cnUpdate=document.getElementById('btn-save-editcn-note');
  const field=name=>document.getElementById('editcn-'+name);let editingCN=null,cnRevision='',cnLines=[],cnDeleted=[],cnBusy=false;
  const round=n=>Math.round((n+Number.EPSILON)*100)/100;
  const fields={Customer:'customer',PostBox:'postbox',Emirate:'emirate',Address:'address',TRN:'vat-no',CreditDate:'date',InvoiceDate:'invoice-date',LPONo:'lpo',CONo:'co-no',InvoiceNo:'invoice-no',Description:'notes',Paid:'paid-value',Status:'status',Mode:'payment-type',PaymentDate:'deldate',ChqNo:'unit-price',PaidInvoiceNo:'discount',InWords:'amount-in-words',CNNumber:'number'};
  // Number references stay fixed; totals are calculated from the editable lines.
  for(const name of ['invoice-no','number','taxable-value','total-vat','grand-total','balance-value','amount-in-words'])if(field(name))field(name).readOnly=true;
  function calculateCNLine(line){line.Taxable=round(line.Quantity*line.UnitPrice*(1-line.Discount/100));line.VatTotal=round(line.Taxable*line.VatPer/100);line.UnitTotal=round(line.Taxable+line.VatTotal);line.Stock=Number(line.LiveStock??line.Stock??0)+line.Quantity-(line.OriginalCNQty??line.Quantity);return line;}
  function cnTotals(){
   const sum=key=>round(cnLines.reduce((total,line)=>total+(Number(line[key])||0),0));
   for(const[name,key]of Object.entries({'taxable-value':'Taxable','total-vat':'VatTotal','grand-total':'UnitTotal'}))field(name).value=sum(key).toFixed(2);
   field('balance-value').value=round(sum('UnitTotal')-(Number(field('paid-value').value)||0)).toFixed(2);
   field('amount-in-words').value=toWordsConfig.convert(sum('UnitTotal'));
  }
  function renderCN(){
   cnBody.replaceChildren();
   cnLines.forEach((line,index)=>{
    const row=document.createElement('tr');row.dataset.sourceKey=line.sourceKey;
    const entries=[line.ItemID??'',index+1,line.Item,line.ReferenceQty,line.Quantity,line.MaximumQty,line.UnitPrice,line.Discount,line.VatPer,line.Taxable,line.VatTotal,line.UnitTotal,line.PID,line.Stock,line.Icost??0,Number(line.Quantity)*Number(line.Icost||0),Number(line.Stock||0)*Number(line.Icost||0),''];
    entries.forEach((value,column)=>{
     const cell=document.createElement('td');
     const editable={4:'Quantity'};
     if(editable[column]){
      const key=editable[column],input=document.createElement('input');input.type=key==='Item'?'text':'number';input.value=value??'';input.className='form-control form-control-sm';input.setAttribute('aria-label',key+' for item '+(index+1));
      if(key!=='Item'){input.min='0';input.step=key==='Quantity'?'1':'0.01';if(key==='Quantity')input.max=line.MaximumQty;if(key==='Discount')input.max='100';}
      input.addEventListener('input',()=>{line[key]=key==='Item'?input.value:Number(input.value);calculateCNLine(line);for(const[col,key]of [[9,'Taxable'],[10,'VatTotal'],[11,'UnitTotal']])row.cells[col].textContent=(Number(line[key])||0).toFixed(2);row.cells[13].textContent=line.Stock;row.cells[15].textContent=(line.Quantity*Number(line.Icost||0)).toFixed(2);row.cells[16].textContent=(line.Stock*Number(line.Icost||0)).toFixed(2);cnTotals();});
      cell.appendChild(input);
     }else if(column===17){const button=document.createElement('button');button.type='button';button.className='btn btn-sm btn-danger';button.textContent='Delete';button.addEventListener('click',()=>{cnDeleted.push(line.sourceKey);cnLines.splice(index,1);renderCN();cnTotals();});cell.appendChild(button);}
     else cell.textContent=typeof value==='number'&&column>=9&&column<=11?value.toFixed(2):value??'';
     row.appendChild(cell);
    });cnBody.appendChild(row);
   });
  }
  function closeCNEdit(){if(cnBusy)return;cnModal.style.display='none';window.parent?.lockSidebarAndRefresh?.(false);}
  cnModal.querySelectorAll('.btn-cancel').forEach(button=>button.addEventListener('click',closeCNEdit));
  field('paid-value')?.addEventListener('input',cnTotals);
  document.getElementById('cn-context-menu').addEventListener('click',async event=>{
   const action=event.target.closest('.cn-context-item')?.dataset.action;if(!action||cnBusy)return;
   const number=String(activeSelectedCreditNoteNo??'').trim();if(!number)return alert('Select a credit note first.');
   document.getElementById('cn-context-menu').style.display='none';
   if(action==='PRINT'){window.location.href='/api/print-credit-note/'+encodeURIComponent(number);return;}
   if(!['EDIT','DELETE'].includes(action))return;
   if(action==='DELETE'&&!confirm(`Delete Credit Note ${number}? This reverses its returned stock and restores invoice CN quantities.`))return;
   cnBusy=true;
   try{
    const response=await fetch('/api/get-credit-note-details?CNNumber='+encodeURIComponent(number)),data=await response.json();
    if(!response.ok||!data.success)throw Error(data.message||'Unable to load CN.');
    if(action==='DELETE'){
     const deleted=await fetch('/api/delete-credit-note',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({CNNumber:number,revision:data.revision})}),result=await deleted.json();
     if(!deleted.ok||!result.success)throw Error(result.message||'Delete failed.');fetchFilteredCreditNotes();alert(result.message);return;
    }
    editingCN=data.master;cnRevision=data.revision;cnDeleted=[];cnLines=data.items.map(line=>calculateCNLine({...line,OriginalCNQty:Number(line.Quantity),LiveStock:Number(line.LiveStock??line.Stock??0),Icost:Number(line.LiveCost??line.Icost??0),Quantity:Number(line.Quantity),UnitPrice:Number(line.UnitPrice),Discount:Number(line.Discount)||0,VatPer:Number(line.VatPer)||0}));cnForm.reset();
    for(const[key,name]of Object.entries(fields))if(field(name)){
     const control=field(name),stored=data.master[key]??'';
     control.value=['date','invoice-date','deldate'].includes(name)?String(stored).split('T')[0]:stored;
     if(control.tagName==='SELECT'&&String(stored)&&!control.value){
      const option=Array.from(control.options).find(option=>option.value.toLowerCase()===String(stored).toLowerCase());
      if(option)control.value=option.value;else{const added=document.createElement('option');added.value=String(stored);added.textContent=String(stored);control.appendChild(added);control.value=String(stored);}
     }
    }
    document.getElementById('editcn-modal-title').textContent='EDIT CREDIT NOTE - '+data.master.CNNumber;
    renderCN();cnTotals();window.parent?.lockSidebarAndRefresh?.(true);cnModal.style.display='flex';
   }catch(error){alert(error.message);}finally{cnBusy=false;}
  });
  cnUpdate.addEventListener('click',async()=>{
   if(cnBusy||!editingCN)return;
   if(!cnLines.length)return alert('Keep at least one item, or cancel and use Delete CN.');
   for(const line of cnLines)if(!Number.isSafeInteger(line.Quantity)||line.Quantity<=0||line.Quantity>line.MaximumQty||!Number.isFinite(line.UnitPrice)||line.UnitPrice<0||!Number.isFinite(line.Discount)||line.Discount<0||line.Discount>100||!Number.isFinite(line.VatPer)||line.VatPer<0||!String(line.Item??'').trim())return alert('Please check CN quantities and rates.');
   if(!field('date').value||!field('customer').value.trim())return alert('Customer and credit date are required.');
   cnTotals();const main=Object.fromEntries(Object.entries(fields).filter(([,name])=>field(name)).map(([key,name])=>[key,field(name).value]));main.CNNumber=editingCN.CNNumber;main.Paid=Number(main.Paid)||0;
   cnBusy=true;cnUpdate.disabled=true;cnUpdate.textContent='Updating…';
   try{
    const response=await fetch('/api/update-credit-note',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({main,items:cnLines,deletedItems:cnDeleted,revision:cnRevision})}),result=await response.json();
    if(!response.ok||!result.success)throw Error(result.message||'Update failed.');
    cnBusy=false;closeCNEdit();fetchFilteredCreditNotes();alert(result.message);
   }catch(error){alert(error.message);}finally{cnBusy=false;cnUpdate.disabled=false;cnUpdate.textContent='Update';}
  });
 }
//#endregion

}
//#endregion 
//==========================================================================================//

//=============================QUOTATIONS=============================================//
//#region 📌 QUOTATIONS CODE ALL INSERT HERE

function initQuotationsPage() {
  let TotalQuote = "";

//#region  LOAD QUOTATIONS FROM DATABASE
              const btnQuoteSearch = document.getElementById("btn-quote-search");
              if (!btnQuoteSearch) return;               
              fetchFilteredQuotations();
//#endregion

//#region  QUOTATION SEARCH BUTTON CLICK EVENT
             btnQuoteSearch.addEventListener("click", fetchFilteredQuotations);

              //================ SEARCH EVENTS FOR RANGE, STATUS, QUOTATION NUMBER, CUSTOMER NAME ====================//
              document.getElementById("filter-quote-range").addEventListener("change", (event) => 
                {
                   // Clear manual parameters so they don't override the dropdown choice
                    document.getElementById("filter-quote-start-date").value = "";
                    document.getElementById("filter-quote-end-date").value = "";
                    fetchFilteredQuotations();
                });
              
             
              document.getElementById("search-quote-customer").addEventListener("input", () => 
                {
                  
                  fetchFilteredQuotations();
                });
//#endregion

//#region  FETCH QUOTATIONS FROM DATABASE FUNCTION
              
              function fetchFilteredQuotations() {
                document.getElementById("quote-head").textContent = `Quotations Registry`;
                const quoteloadingOverlay = document.getElementById("quote-loading-overlay");
                const quotetableBlock = document.getElementById("quote-table-display-block");
                const quotetbody = document.getElementById("quote-rows");
                
                quoteloadingOverlay.style.display = "block";
                quotetableBlock.style.opacity = "0.4";

                const payload = {
                  // QuotationNo: document.getElementById("search-quote-no").value.trim(),
                  // Customer: document.getElementById("search-quote-customer").value.trim(),
                  searchQuery: document.getElementById("search-quote-customer").value,
                  // Status: document.getElementById("filter-quote-status").value,
                  timeRange: document.getElementById("filter-quote-range").value,
                  startDate: document.getElementById("filter-quote-start-date").value,
                  endDate: document.getElementById("filter-quote-end-date").value,
                };
                //console.log("[ERP DEBUG] Credit Notes Data Retrieved:", payload);

                fetch("/api/quotations", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                  
                })
                
                  .then((res) => res.json())
                  .then((data) => { 
                    // console.log("[ERP DEBUG] Credit Notes Data Retrieved:", data.creditnotes);
                    quotetbody.innerHTML = "";
                    quoteloadingOverlay.style.display = "none";
                    quotetableBlock.style.opacity = "1.0";
                    
                    //TotalQuote = data.quotations.length;//total quotations count
                    if (
                      !data.success || !data.quotations || data.quotations.length === 0) {
                      
                      quotetbody.innerHTML =
                        '<tr><td colspan="13" class="text-center text-muted py-3">No matching quotation records found inside database registry.</td></tr>';
                      return;
                      
                    }
                    
                    TotalQuote = "";
                    TotalQuote = data.quotations.length;//total quotations count
                                       // 1. Extract all dates and convert them to timestamps
                    const timestamps = data.quotations.map(quotation => new Date(quotation.QuotationDate).getTime());
                    // 2. Find the minimum and maximum timestamps
                    const minTimestamp = Math.min(...timestamps);
                    const maxTimestamp = Math.max(...timestamps);     
                    //  Registry &nbsp;&nbsp;&nbsp; From &nbsp; ${formatToDdMMMyyyy(minTimestamp)} &nbsp; To &nbsp;  ${formatToDdMMMyyyy(maxTimestamp)} &nbsp;&nbsp; Total Quotations                
                    document.getElementById("quote-head").innerHTML = `Quotations(${TotalQuote})`;
                    const now = new Date();
                    document.getElementById("quote-head-date").innerHTML = formatToDdMMMyyyy(now);
                    // 💡 DYNAMICALLY UPDATE THE DATE PICKERS FOR DELIVERY ORDERS
                    if (data.computedDates.from) {
                        document.getElementById("filter-quote-start-date").value = data.computedDates.from;
                    } else {
                        document.getElementById("filter-quote-start-date").value = ""; // Clear if FULL history selection
                    }

                    if (data.computedDates.to) {
                        document.getElementById("filter-quote-end-date").value = data.computedDates.to;
                    } else {
                        document.getElementById("filter-quote-end-date").value = ""; // Clear if FULL history selection
                    }

                    data.quotations.forEach((quote) => {
                      const row = document.createElement("tr");
                      TotalQuote = quote.length;//total quotations count
                      // 2. 💡 CRITICAL FIX: Set your data markers directly onto the element object wrapper!
                      row.setAttribute('data-id', quote.ID || "");
                      row.setAttribute('data-quoteno', quote.QuotationNo || "");
                      let badgeClass = "text-danger";
                      let rowTextColorStyle = ""; // 🎯 Holder for row inline color styles
                      // 2. 🎨 MAP ROW TEXT COLOR DIRECTLY TO FINANCIAL REGISTRY STATUSES
                      const quoteTypeValues = (quote.QuoteType || "QUOTATION").toUpperCase();

                      if (quoteTypeValues === "QUOTATION") {
                        //badgeClass = "bg-success";
                        rowTextColorStyle = "color: blue;"; // green
                      } else if (quoteTypeValues === "QUOTATION (Revised)" || quoteTypeValues === "QUOTATION (REVISED)") {
                        //badgeClass = "bg-warning text-dark";
                        rowTextColorStyle = "color: red;"; // red
                      } else if (quoteTypeValues === "QUOTATION (Final)" || quoteTypeValues === "QUOTATION (FINAL)") {
                        badgeClass = "bg-info text-dark";
                        rowTextColorStyle = "color: green;"; // purple
                       } 
                      //else if (
                      //   quoteTypeValues === "ADV.PAID" ||
                      //   quoteTypeValues === "ADVANCE PAID"
                      // ) {
                      //   badgeClass = "bg-danger";
                      //   rowTextColorStyle = "color: blue;"; //  blue text row
                      // }
                      // 3. Inject the style attribute directly into the opening <tr> element node
                      if (rowTextColorStyle) {
                        row.setAttribute("style", rowTextColorStyle);
                      }
                      
                      row.innerHTML = `
                        
                        <td class="col-width-id">${quote.ID || "N/A"}</td> <!-- 🎯 ADDED CLASS HERE TO HIDE CELL -->
                        <td class="col-width-sd" style="text-align: center;">${quote.QuotationNo || "N/A"}</td>
                        <td class="col-width-md" style="text-align: center;">${formatToDdMMMyyyy(quote.QuotationDate)}</td>
                        <td class="col-width-customer">${quote.Customer || "CASH"}</td>
                        <td class="col-width-sm" style="text-align: center;">${quote.Emirate || "ABU DHABI"}</td>
                        <td class="col-width-md" style="text-align: right;">${parseFloat(quote.SubTotal || 0).toFixed(2)}</td>
                        <td class="col-width-md" style="text-align: right;">${parseFloat(quote.VatTotal || 0).toFixed(2)}</td>
                        <td class="col-width-md" style="text-align: right;">${parseFloat(quote.GrandTotal || 0).toFixed(2)}</td>
                        <td class="col-width-md" style="text-align: center;">${quote.QuoteType || "QUOTATION"}</td>
                        <td class="col-width-sm" style="text-align: center;">${quote.User_name || "-"}</td>
                        
                    `;
                      quotetbody.appendChild(row);
                    });
                    
                  })
                  .catch((err) => {
                    console.error("Critical rendering pipeline issue:", err);
                    quoteloadingOverlay.style.display = "none";
                    quotetableBlock.style.opacity = "1.0";
                    quotetbody.innerHTML =
                      '<tr><td colspan="13" class="text-center text-danger py-3">Error streaming dataset values. Check server connection metrics.</td></tr>';
                  });
                  
              }
              // 🎯 GLOBAL STORAGE TRACKER FOR THE ACTIVE SELECTED CREDIT NOTE DATA
              let activeSelectedQuotationNo = null;
              let activeSelectedQuotationId = null;
              
//#endregion

//#region  BUTTON QUOTATIONS RESET CLICK EVENT
              document.getElementById("btn-quote-reset").addEventListener("click", () => 
                {
                  // document.getElementById("search-quote-no").value = "";
                  document.getElementById("search-quote-customer").value = "";
                  // document.getElementById("filter-quote-status").value = "ALL";
                  document.getElementById("filter-quote-range").value = "3MONTH";
                  document.getElementById("filter-quote-start-date").value = "";
                  document.getElementById("filter-quote-end-date").value = "";
                  fetchFilteredQuotations();
                });
//#endregion ============ END BUTTON RESET CLICK EVENT ===================================//

//#region  OPEN QUOTATIONS DYNAMIC CONTEXT MENU
              document.getElementById("quote-rows").addEventListener("contextmenu", function (e) {
                  const clickedRow = e.target.closest("tr");
                  if (!clickedRow) return;
                  // const cells = clickedRow.getElementsByTagName("td");
                  // if (!cells || cells.length < 13) return; // Ignore loose spaces or empty rows
                  e.preventDefault();
                  // ⚡ INSTANT READ: Bypasses innerText geometry checks completely!
                  activeSelectedQuotationId = clickedRow.getAttribute("data-id") || "";
                  activeSelectedQuotationNo = clickedRow.getAttribute("data-quoteno") || "";
                  //console.log(`[ERP DEBUG] Fast Lock: ${activeSelectedCreditNoteNo}`);
                  // 🎯 THE FRONTEND FIX: Read InvoiceNo directly out of index cell 1
                  // Index 0 is hidden ID, Index 1 is Invoice Number string
                  // activeSelectedInvoiceId = cells[0].innerText.trim() || cells[0].textContent.trim();
                  // activeSelectedInvoiceNo = cells[1].innerText.trim() || cells[1].textContent.trim();
                  // Clean any trailing tags or line breaks from the invoice number string
                  activeSelectedQuotationNo = activeSelectedQuotationNo.replace(/<[^>]*>/g, "").trim();
                  //console.log(`[ERP DEBUG] Fast Lock: ${activeSelectedQuotationNo}`);
                // ⚡ OPTIMIZATION 1: Clear ONLY the single previously highlighted row instead of looping through all rows
                const oldHighlightedRow = document.querySelector("#quote-rows tr.quote-rows-highlight-context");
                if (oldHighlightedRow) {
                  oldHighlightedRow.classList.remove("quote-rows-highlight-context");
                }
                clickedRow.classList.add("quote-rows-highlight-context");

                const menuElement = document.getElementById("quote-context-menu");
                // ⚡ OPTIMIZATION 2: Pre-set display styles before reading geometric layout sizes
                menuElement.style.visibility = "hidden"; // Render invisibly first so it takes shape in the DOM
                menuElement.style.display = "block";


                  // Highlight row visually
                  // document.querySelectorAll("#invoice-rows tr").forEach((row) => row.classList.remove("invoices-row-highlight-context"),);
                  // clickedRow.classList.add("invoices-row-highlight-context");

                  //const menuElement = document.getElementById("invoices-context-menu",);
                  
                  // menuElement.style.display = "block";
                  //menuElement.style.left = e.clientX + "px";
                  //menuElement.style.top = e.clientY + "px";
                  // 2. Get your monitor window sizes and menu sizes
                const menuWidth = menuElement.offsetWidth || 150;
                const menuHeight = menuElement.offsetHeight || 120;
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;

                // 3. Calculate ideal X (Horizontal) Position
                // If opening to the right goes off-screen, flip it to open to the left
                let targetX = e.clientX;
                if (e.clientX + menuWidth > windowWidth) {
                  targetX = windowWidth - menuWidth - 10; // 10px safety margin from window edge
                }
                
                // 4. Calculate ideal Y (Vertical) Position
                // If opening downward goes off-screen, flip it to open upward instead!
                let targetY = e.clientY;
                if (e.clientY + menuHeight > windowHeight) {
                  targetY = e.clientY - menuHeight; // Shifts the menu completely above your cursor
                  
                  // Safety check: if it hits the absolute top of the viewport
                  if (targetY < 0) targetY = 10; 
                }
                
                // 5. Apply the safe, un-clipped coordinates
                menuElement.style.left = targetX + "px";
                menuElement.style.top = targetY + "px";
                menuElement.style.visibility = "visible"; 
                e.stopPropagation();
                });

              // 🎯 HIDE MENU SCRIPT: Closes popup if user clicks anywhere else on screen
              document.addEventListener("click", function (e) {
                const menuElement = document.getElementById(
                  "quote-context-menu",
                );
                if (!e.target.closest("#quote-context-menu")) {
                  menuElement.style.display = "none";
                  document
                    .querySelectorAll("#quote-rows tr")
                    .forEach((row) =>
                      row.classList.remove("quote-rows-highlight-context"),
                    );
                }
              });
//#endregion

//#region  FORMAT DATE TO DISPLAY DD-MMM-YYYY
              function formatToDdMMMyyyy(dateString) {
                if (!dateString) return "N/A";
                const dateObj = new Date(dateString);
                if (isNaN(dateObj.getTime())) return "N/A";
                const day = String(dateObj.getDate()).padStart(2, "0");
                const yy = String(dateObj.getFullYear()).slice(-2);
                const months = [
                  "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",
                ];
                return (
                  day + "-" + months[dateObj.getMonth()] + "-" + yy
                );
              }
//#endregion ============ END FORMAT DATE TO DISPLAY DD-MMM-YYYY===================================//

//#region EDIT QUOTATION: fetch selected master and embedded items
  const editQuoteModal = document.getElementById('editquot-modal-overlay');
  if (editQuoteModal) {
    let quoteLoading = false;
    // Match the existing manager-only reveal used by New Quotation/Edit Invoice.
    const quotationSecretForm = document.getElementById('editquot-invoice-master-form');
    const quotationSecretTable = document.getElementById('editquot-invoice-table');
    const quotationCountdown = document.getElementById('editquot-countdown-seconds');
    let quotationSecretTimer = null;
    let quotationSecondsRemaining = 30;
    function lockQuotationSecrets() {
      quotationSecretForm.classList.remove('show-secret');
      quotationSecretTable.classList.remove('show-secret');
      if(document.getElementById('newinvitems-modal-overlay')?.dataset.owner==='edit-quotation')document.getElementById('newinvitems-transaction-form')?.classList.remove('show-secret');
      quotationCountdown.style.display = 'none';
      if (quotationSecretTimer !== null) clearInterval(quotationSecretTimer);
      quotationSecretTimer = null;
    }
    function startQuotationSecretTimer() {
      if (quotationSecretTimer !== null) clearInterval(quotationSecretTimer);
      quotationSecondsRemaining = 30;
      quotationCountdown.textContent = quotationSecondsRemaining;
      quotationCountdown.style.display = 'block';
      quotationSecretTimer = setInterval(() => {
        quotationSecondsRemaining--;
        quotationCountdown.textContent = quotationSecondsRemaining;
        if (quotationSecondsRemaining <= 0) lockQuotationSecrets();
      }, 1000);
    }
    quotationSecretForm.addEventListener('dblclick', event => {
      if (event.target.closest('input, button, select, textarea, a, table')) return;
      if (quotationSecretForm.classList.contains('show-secret')) return lockQuotationSecrets();
      const password = prompt('Enter manager password to view restricted columns:');
      if (password === 'admin123') {
        quotationSecretForm.classList.add('show-secret');
        quotationSecretTable.classList.add('show-secret');
        startQuotationSecretTimer();
      } else if (password !== null) alert('Incorrect password. Access denied.');
    });
    for (const activity of ['mousemove', 'keypress', 'input', 'pointerdown']) {
      quotationSecretForm.addEventListener(activity, () => {
        if (quotationSecretForm.classList.contains('show-secret')) startQuotationSecretTimer();
      });
    }
    lockQuotationSecrets();

    const quoteField = name => document.getElementById('editquot-' + name);
    const blockQuoteRefresh = event => {
      if (event.key === 'F5' || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'r')) event.preventDefault();
    };
    function closeQuotationEditor() {
      closeQuoteRowEditor();hideQuoteRowMenu();
      lockQuotationSecrets();
      editQuoteModal.style.display = 'none';
      window.removeEventListener('keydown', blockQuoteRefresh);
      window.parent?.lockSidebarAndRefresh?.(false);
    }
    // Replace the copied inline Cancel action with the quotation-specific close.
    editQuoteModal.querySelectorAll('.btn-cancel').forEach(button => {
      button.removeAttribute('onclick');
      button.addEventListener('click', closeQuotationEditor);
    });
    // Edit Quotation rows reuse the same small New Invoice item editor.
    const quoteRows=document.getElementById('editquot-modal-items-rows');
    const quoteRowMenu=document.getElementById('editquot-context-menu');
    const quoteRowEditor=document.getElementById('newinvitems-modal-overlay');
    const quoteRowForm=document.getElementById('newinvitems-transaction-form');
    const quoteItem=name=>document.getElementById('newinvitems-'+name);
    let quoteSelectedRow=null, quoteEditRow=null, quoteHoldTimer=null;
    const hideQuoteRowMenu=()=>{quoteRowMenu.style.display='none';};
    function closeQuoteRowEditor(){if(quoteRowEditor.dataset.owner==='edit-quotation')quoteRowEditor.style.display='none';quoteEditRow=null;}
    function quoteRowTotals(){
      const sum=column=>Array.from(quoteRows.rows).reduce((total,row)=>total+(Number(row.cells[column]?.textContent)||0),0);
      for(const [name,column]of Object.entries({'taxable-value':9,'total-vat':10,'grand-total':11,'t-cost':15,'t-margin':17}))quoteField(name).value=sum(column).toFixed(2);
      quoteField('amount-in-words').value=toWordsConfig.convert(Number(sum(11).toFixed(2)));
      Array.from(quoteRows.rows).forEach((row,index)=>{if(row.cells[0].textContent!==String(index+1))row.cells[0].textContent=String(index+1);});
    }
    function calculateQuoteRow(){
      if(quoteRowEditor.dataset.owner!=='edit-quotation'||!quoteEditRow)return null;
      const num=name=>Number(quoteItem(name).value);
      const quantity=num('qty'),price=num('unit-price'),discount=num('disc-per'),vat=num('vat-per'),cost=num('i-cost');
      const round=value=>Math.round((value+Number.EPSILON)*100)/100;
      const taxable=round(quantity*price*(1-discount/100)), vatTotal=round(taxable*vat/100), ucost=round(quantity*cost);
      const stock=Math.max(0,num('o-stock')-quantity);
      const result={quantity,price,discount,vat,taxable,vatTotal,total:round(taxable+vatTotal),ucost,margin:round(taxable-ucost),stock,svalue:round(stock*cost)};
      for(const [name,value]of Object.entries({'taxable':taxable,'vat-total':vatTotal,'unit-total':result.total,'disc-amt':price*discount/100,'u-cost':ucost,'u-margin':result.margin,'s-value':result.svalue}))quoteItem(name).value=value.toFixed(2);
      quoteItem('a-stock').value=stock;return result;
    }
    function openQuoteRowEditor(row){
      if(!row||row.cells.length!==19||updatingQuote)return;
      quoteEditRow=row;quoteRowEditor.dataset.owner='edit-quotation';hideQuoteRowMenu();
      const cell=n=>row.cells[n].textContent;
      for(const [name,column]of Object.entries({'sr-number':0,product:1,qty:2,'i-size':3,'i-ral':4,'i-unit':5,'unit-price':6,'disc-per':7,'vat-per':8,pid:12,'i-cost':14}))quoteItem(name).value=cell(column);
      const live=row.dataset.liveStock;
      quoteItem('o-stock').value=live!==undefined&&live!==''?live:(row.dataset.openStock??(Number(cell(13))+Number(cell(2))));
      document.getElementById('newinvitems-title-text').textContent='Edit Row - Sr No- '+cell(0);
      quoteRowForm.classList.toggle('show-secret',quotationSecretForm.classList.contains('show-secret'));
      calculateQuoteRow();
      const viewport=window.visualViewport;
      quoteRowEditor.style.setProperty('--item-visible-height',(viewport?.height??innerHeight)+'px');
      quoteRowEditor.style.setProperty('--item-visible-top',(viewport?.offsetTop??0)+'px');
      quoteRowEditor.style.display='flex';
    }
    function showQuoteRowMenu(row,x,y){
      if(!row||row.cells.length!==19||updatingQuote)return;
      quoteSelectedRow=row;quoteRowMenu.style.display='block';
      quoteRowMenu.style.left=Math.max(6,Math.min(x,innerWidth-quoteRowMenu.offsetWidth-6))+'px';
      quoteRowMenu.style.top=Math.max(6,Math.min(y,innerHeight-quoteRowMenu.offsetHeight-6))+'px';
    }
    quoteRows.addEventListener('contextmenu',event=>{event.preventDefault();event.stopPropagation();clearTimeout(quoteHoldTimer);showQuoteRowMenu(event.target.closest('tr'),event.clientX,event.clientY);});
    quoteRows.addEventListener('dblclick',event=>openQuoteRowEditor(event.target.closest('tr')));
    let quoteTouchStart;
    quoteRows.addEventListener('pointerdown',event=>{
      if(event.pointerType==='mouse')return;
      quoteTouchStart={x:event.clientX,y:event.clientY};clearTimeout(quoteHoldTimer);
      quoteHoldTimer=setTimeout(()=>showQuoteRowMenu(event.target.closest('tr'),event.clientX,event.clientY),550);
    });
    quoteRows.addEventListener('pointermove',event=>{if(quoteTouchStart&&Math.hypot(event.clientX-quoteTouchStart.x,event.clientY-quoteTouchStart.y)>10)clearTimeout(quoteHoldTimer);});
    for(const type of ['pointerup','pointercancel'])quoteRows.addEventListener(type,()=>clearTimeout(quoteHoldTimer));
    quoteRowMenu.addEventListener('click',event=>{
      const action=event.target.closest('[data-action]')?.dataset.action;hideQuoteRowMenu();
      if(!quoteSelectedRow||quoteSelectedRow.parentElement!==quoteRows)return;
      if(action==='EDIT')openQuoteRowEditor(quoteSelectedRow);
      else if(action==='DELETE'&&!updatingQuote&&confirm('Delete this quotation item?')){quoteSelectedRow.remove();quoteSelectedRow=null;quoteRowTotals();}
    });
    for(const name of ['qty','unit-price','disc-per','vat-per'])quoteItem(name).addEventListener('input',calculateQuoteRow);
    document.getElementById('newinvitems-update-button').addEventListener('click',()=>{
      const result=calculateQuoteRow();if(!result)return;
      if(!Number.isFinite(result.quantity)||result.quantity<=0||!Number.isFinite(result.price)||result.price<=0||!Number.isFinite(result.discount)||result.discount<0||result.discount>100||!Number.isFinite(result.vat)||result.vat<0)return alert('Please check quantity, price, discount and VAT.');
      const values={2:result.quantity,3:quoteItem('i-size').value,4:quoteItem('i-ral').value,5:quoteItem('i-unit').value,6:result.price.toFixed(2),7:result.discount,8:result.vat,9:result.taxable.toFixed(2),10:result.vatTotal.toFixed(2),11:result.total.toFixed(2),13:result.stock,15:result.ucost.toFixed(2),16:result.svalue.toFixed(2),17:result.margin.toFixed(2)};
      Object.entries(values).forEach(([column,value])=>quoteEditRow.cells[column].textContent=value);
      quoteEditRow.dataset.openStock=quoteItem('o-stock').value;
      // Existing data-id / PID and other metadata remain attached to the row.
      quoteRowTotals();closeQuoteRowEditor();
    });
    quoteRowEditor.querySelectorAll('.btn-cancel').forEach(button=>button.addEventListener('click',closeQuoteRowEditor));
    for(const activity of ['pointerdown','input','keypress'])quoteRowForm.addEventListener(activity,()=>{if(quoteRowEditor.dataset.owner==='edit-quotation'&&quotationSecretForm.classList.contains('show-secret'))startQuotationSecretTimer();});
    document.addEventListener('pointerdown',event=>{if(!event.target.closest('#editquot-context-menu'))hideQuoteRowMenu();});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'){hideQuoteRowMenu();closeQuoteRowEditor();}});

    let updatingQuote = false;
    const updateQuoteButton = document.getElementById('btn-save-editquot');
    updateQuoteButton.textContent = 'Update';
    updateQuoteButton.addEventListener('click', async () => {
      if (updatingQuote) return;
      const get = name => quoteField(name)?.value.trim() ?? '';
      const quoteNo = editQuoteModal.dataset.quotationNo;
      if (!quoteNo) return alert('Please reopen the quotation before updating.');
      if (!get('customer') || !get('invoice-date')) return alert('Customer and quotation date are required.');
      const rows = Array.from(document.getElementById('editquot-modal-items-rows').rows);
      if (!rows.length) return alert('Please keep at least one quotation item.');
      const mapping = {Customer:'customer', Postbox:'postbox', Address:'address', Emirate:'emirate', VatNo:'vat-no',
        QuotationDate:'invoice-date', Notes:'notes', InWords:'amount-in-words', Validity:'validity-terms', PaymentTerms:'payment-terms',
        QuoteType:'type', RefNo:'ref-no', CustContact:'contact-person', ContactNo:'contact-number', Subject:'subject',
        DeliveryTerms:'delivery-terms', OurContact:'our-contact', OurNumber:'our-number', ProjectName:'project-name', CurrencyType:'currency'};
      const main = Object.fromEntries(Object.entries(mapping).map(([key, name]) => [key, get(name)]));
      main.QuotationNo = quoteNo;
      const items = rows.map(row => {
        const cell = index => row.cells[index]?.textContent.trim() ?? '';
        return { ID:row.dataset.id || '', Item:cell(1), Quantity:Number(cell(2)), ISize:cell(3), IRAL:cell(4), IUnit:cell(5),
          UnitPrice:Number(cell(6)), LessDiscount:Number(cell(7)), VatPer:Number(cell(8)), PID:cell(12),
          Stock:Number(cell(13)), Icost:Number(cell(14)) };
      });
      updatingQuote = true;
      updateQuoteButton.disabled = true;
      updateQuoteButton.textContent = 'Updating…';
      try {
        const response = await fetch('/api/update-quotation', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({main, items})});
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || result.message || 'Unable to update quotation.');
      } catch (error) {
        alert('Could not update quotation: ' + error.message);
        return;
      } finally {
        updatingQuote = false;
        updateQuoteButton.disabled = false;
        updateQuoteButton.textContent = 'Update';
      }
      closeQuotationEditor();
      fetchFilteredQuotations();
      alert(`Quotation ${quoteNo} updated successfully.`);
    });

    document.getElementById('quote-context-menu').addEventListener('click', async event => {
      const action = event.target.closest('.quote-context-item');
      if (!action) return;
      if (action.dataset.action === 'PRINT SIMPLE' || action.dataset.action === 'PRINT WITH COVERING LETTER') {
        const quotationNo = String(activeSelectedQuotationNo ?? '').trim();
        document.getElementById('quote-context-menu').style.display = 'none';
        if (!quotationNo) return alert('Please select a quotation first.');
        const endpoint = action.dataset.action === 'PRINT WITH COVERING LETTER' ? '/api/print-quotation-cover/' : '/api/print-quotation/';
        window.location.href = endpoint + encodeURIComponent(quotationNo);
        return;
      }
      if (action.dataset.action !== 'EDIT' || quoteLoading) return;
      const quotationNo = String(activeSelectedQuotationNo ?? '').trim();
      document.getElementById('quote-context-menu').style.display = 'none';
      if (!quotationNo) return alert('Please select a quotation first.');
      quoteLoading = true;
      action.setAttribute('aria-busy', 'true');
      try {
        const response = await fetch('/api/get-quotation-details?QuotationNo=' + encodeURIComponent(quotationNo));
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error || payload.message || 'Unable to load quotation.');
        const {master, items} = payload;
        if (!master || !Array.isArray(items)) throw new Error('Invalid quotation details response.');
        lockQuotationSecrets();
        document.getElementById('editquot-invoice-master-form').reset();
        const mapping = {Customer:'customer', Postbox:'postbox', Address:'address', Emirate:'emirate',
          VatNo:'vat-no', QuotationNo:'invoice-number', Notes:'notes', InWords:'amount-in-words', Validity:'validity-terms',
          PaymentTerms:'payment-terms', QuoteType:'type', RefNo:'ref-no', CustContact:'contact-person', ContactNo:'contact-number',
          Subject:'subject', DeliveryTerms:'delivery-terms', OurContact:'our-contact', OurNumber:'our-number',
          ProjectName:'project-name', CurrencyType:'currency'};
        for (const [key, name] of Object.entries(mapping)) if (quoteField(name)) quoteField(name).value = master[key] ?? '';
        quoteField('invoice-date').value = String(master.QuotationDate ?? '').split('T')[0];
        for (const [key, name] of Object.entries({SubTotal:'taxable-value', VatTotal:'total-vat', GrandTotal:'grand-total', InvCost:'t-cost', InvMargin:'t-margin'})) {
          if (quoteField(name)) quoteField(name).value = (Number(master[key]) || 0).toFixed(2);
        }
        document.getElementById('editquot-modal-title').textContent = `EDIT QUOTATION - ${master.Customer ?? ''} - ${master.QuotationNo}`;
        editQuoteModal.dataset.quotationNo = String(master.QuotationNo);
        const body = document.getElementById('editquot-modal-items-rows');
        body.replaceChildren();
        const money = value => (Number(value) || 0).toFixed(2);
        for (const item of items) {
          const row = document.createElement('tr');
          row.dataset.id = String(item.ID ?? item._id ?? '');
          row.dataset.pid = String(item.PID ?? '');
          row.dataset.liveStock = item.LiveStockCount ?? '';
          row.dataset.liveCost = item.LiveCost ?? '';
          const stock = item.LiveStockCount ?? item.Stock ?? 0;
          // Retain quoted costs/prices; expose current product values separately.
          const values = [item.SrNo, item.Item, item.Quantity, item.ISize, item.IRAL, item.IUnit,
            money(item.UnitPrice), item.LessDiscount ?? 0, item.VatPer ?? 0, money(item.UnitTaxable),
            money(item.VatTotal), money(item.TotalPrice), item.PID, stock, money(item.Icost),
            money(item.Ucost), money(Number(stock) * Number(item.Icost || 0)), money(item.Umargin), item.Status ?? ''];
          values.forEach((value, index) => {
            const cell = document.createElement('td');
            cell.textContent = value ?? '';
            cell.className = index === 1 ? 'text-start' : 'text-end';
            row.appendChild(cell);
          });
          body.appendChild(row);
        }
        window.parent?.lockSidebarAndRefresh?.(true);
        window.addEventListener('keydown', blockQuoteRefresh);
        editQuoteModal.style.display = 'flex';
      } catch (error) {
        alert('Could not load quotation: ' + error.message);
      } finally {
        quoteLoading = false;
        action.removeAttribute('aria-busy');
      }
    });
  }
//#endregion

  const quoteFilterButton = document.querySelector('.ledger-filter-toggle');
  const quoteFilters = document.getElementById('ledger-filters');
  if (quoteFilterButton && quoteFilters) {
    const small = window.matchMedia('(max-width: 767px)');
    function collapseQuoteFilters(collapsed) {
      document.body.classList.toggle('ledger-filters-collapsed', collapsed);
      quoteFilterButton.setAttribute('aria-expanded', String(!collapsed));
      quoteFilterButton.setAttribute('aria-label', collapsed ? 'Show filters' : 'Hide filters');
      quoteFilterButton.title = collapsed ? 'Show filters' : 'Hide filters';
    }
    quoteFilterButton.addEventListener('click', () => { if (small.matches) collapseQuoteFilters(!document.body.classList.contains('ledger-filters-collapsed')); });
    small.addEventListener('change', () => collapseQuoteFilters(small.matches));
    collapseQuoteFilters(small.matches);
  }

// Quotation mobile groups. Existing field nodes return to their original desktop positions.
(() => {
  function initializeEditQuotationMobileLayout() {
    const modal = document.getElementById('editquot-modal-overlay');
    const form = document.getElementById('editquot-invoice-master-form');
    if (!modal || !form || form.dataset.quotationLayoutReady) return;
    form.dataset.quotationLayoutReady = 'true';
    const definitions = [
      ['Customer Details', [
        ['customer'], ['postbox', 'emirate'], ['address'],
        ['vat-no', 'invoice-date'], ['contact-person', 'contact-number']
      ]],
      ['Quotation Details', [
        ['invoice-number', 'ref-no'], ['validity-terms'], ['subject'], ['payment-terms'],
        ['project-name'], ['type', 'delivery-terms'], ['our-contact', 'our-number'],
        ['currency', 'notes']
      ]],
      ['Item Details', [
        ['item-code'], ['products'], ['qty', 'i-size'], ['i-ral', 'i-unit'],
        ['unit-price', 'disc-per', 'vat-per'], ['taxable', 'vat-total'],
        ['unit-total', 'disc-amt'], ['i-cost', 'u-cost', 'u-margin'],
        ['s-value', 't-cost', 't-margin']
      ]],
      ['Totals & Stock', [
        ['pid', 'o-stock', 'a-stock'], ['taxable-value', 'total-vat', 'grand-total'],
        ['amount-in-words'], ['btn-add']
      ]]
    ];
    const mobile = matchMedia('(max-width: 767px)');
    const originalRows = Array.from(form.children).filter(el => el.tagName === 'DIV');
    const tableRow = originalRows.find(row => row.querySelector('#editquot-invoice-table'));
    tableRow?.classList.add('invoice-mobile-table-section');
    const header = modal.firstElementChild?.firstElementChild;
    header?.classList.add('mobile-entry-head');
    const heading = modal.querySelector('h4');
    if (heading) heading.dataset.mobileTitle = 'Edit Quotation';
    const moves = [];
    const sections = [];
    function remember(node) {
      const anchor = document.createComment('quotation desktop field position');
      node.before(anchor);
      moves.push({ node, anchor });
      return node;
    }
    definitions.forEach(([title, rows], index) => {
      const section = document.createElement('section');
      section.className = 'quotation-mobile-group';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'quotation-mobile-toggle';
      button.textContent = title;
      const body = document.createElement('div');
      body.id = 'editquotation-mobile-group-' + (index + 1);
      body.className = 'quotation-mobile-group-body';
      body.hidden = true;
      button.setAttribute('aria-controls', body.id);
      button.setAttribute('aria-expanded', 'false');
      button.addEventListener('click', () => {
        body.hidden = !body.hidden;
        button.setAttribute('aria-expanded', String(!body.hidden));
      });
      rows.forEach(suffixes => {
        const row = document.createElement('div');
        row.className = 'quotation-mobile-row';
        row.dataset.fields = suffixes.join(' ');
        row.style.setProperty('--quotation-row-columns', String(suffixes.length));
        suffixes.forEach(suffix => {
          const control = document.getElementById('editquot-' + suffix);
          if (!control) return;
          const field = remember(control.parentElement);
          field.classList.add('quotation-mobile-field');
          // Store the destination without moving the desktop field yet.
          moves[moves.length - 1].destination = row;
        });
        // Retain the original Sale action alongside Item Code.
        if (suffixes[0] === 'item-code') {
          const sale = originalRows.flatMap(r => Array.from(r.children)).find(el => el.querySelector('button:not([id])'));
          if (sale) {
            remember(sale).classList.add('quotation-sale-field');
            moves[moves.length - 1].destination = row;
          }
        }
        body.appendChild(row);
      });
      section.append(button, body);
      form.insertBefore(section, originalRows[0]);
      sections.push({ body, button });
    });
    function applyLayout() {
      modal.classList.toggle('quotation-mobile-active', mobile.matches);
      moves.forEach(({ node, anchor, destination }) => {
        if (mobile.matches) destination.appendChild(node);
        else anchor.after(node);
      });
    }
    mobile.addEventListener('change', applyLayout);
    applyLayout();
    form.addEventListener('invalid', event => {
      if (!mobile.matches) return;
      const section = sections.find(({ body }) => body.contains(event.target));
      if (section) { section.body.hidden = false; section.button.setAttribute('aria-expanded', 'true'); }
    }, true);
    const viewport = window.visualViewport;
    let frame = 0;
    function updateViewport() {
      frame = 0;
      modal.style.setProperty('--quotation-visible-height', (viewport?.height ?? innerHeight) + 'px');
      modal.style.setProperty('--quotation-visible-top', (viewport?.offsetTop ?? 0) + 'px');
    }
    function scheduleViewport() { if (!frame) frame = requestAnimationFrame(updateViewport); }
    viewport?.addEventListener('resize', scheduleViewport);
    viewport?.addEventListener('scroll', scheduleViewport);
    window.addEventListener('resize', scheduleViewport);
    updateViewport();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeEditQuotationMobileLayout);
  else initializeEditQuotationMobileLayout();
})();


// New quotation calculations and Add Item (scoped to avoid invoice totals).
(function () {
  function initializeEditQuotationItems() {
    const form = document.getElementById('editquot-invoice-master-form');
    const body = document.getElementById('editquot-modal-items-rows');
    const button = document.getElementById('editquot-btn-add');
    if (!form || !body || !button || form.dataset.quotationItemsReady) return;
    form.dataset.quotationItemsReady = 'true';
    const field = name => document.getElementById('editquot-' + name);
    const number = name => {
      const value = Number(field(name).value);
      return Number.isFinite(value) ? value : 0;
    };
    const money = value => value.toFixed(2);
    function calculate() {
      const quantity = number('qty');
      const price = number('unit-price');
      const discount = price * number('disc-per') / 100;
      const taxable = (price - discount) * quantity;
      const vat = taxable * number('vat-per') / 100;
      const cost = number('i-cost') * quantity;
      const stock = Math.max(0, number('o-stock') - quantity);
      const values = {
        taxable, 'vat-total': vat, 'unit-total': taxable + vat,
        'disc-amt': discount, 'u-cost': cost, 'u-margin': taxable - cost,
        's-value': stock * number('i-cost')
      };
      Object.entries(values).forEach(([name, value]) => { field(name).value = money(value); });
      field('a-stock').value = String(stock);
      field('a-stock').style.backgroundColor = stock > 0 ? '#018b22' : '#a30010';
      field('a-stock').style.color = '#ffffff';
    }
    window.calculateDynamicEditQuotationTotal = calculate;
    ['qty', 'unit-price', 'disc-per', 'vat-per', 'i-cost', 'o-stock'].forEach(name => {
      field(name).addEventListener('input', calculate);
      field(name).addEventListener('change', calculate);
    });
    function totals() {
      const sum = column => Array.from(body.rows).reduce((total, row) =>
        total + (Number(row.cells[column]?.textContent) || 0), 0);
      field('taxable-value').value = money(sum(9));
      field('total-vat').value = money(sum(10));
      field('grand-total').value = money(sum(11));
      field('t-cost').value = money(sum(15));
      field('t-margin').value = money(sum(17));
      field('amount-in-words').value = toWordsConfig.convert(Number(money(sum(11))));
      Array.from(body.rows).forEach((row, index) => { if (row.cells[0].textContent !== String(index + 1)) row.cells[0].textContent = String(index + 1); });
    }
    function warn(name, message) {
      alert(message);
      const input = field(name);
      const section = input.closest('.quotation-mobile-group');
      const toggle = section?.querySelector('.quotation-mobile-toggle');
      if (toggle?.getAttribute('aria-expanded') === 'false') toggle.click();
      input.focus();
    }
    button.addEventListener('click', function () {
      if (!field('products').value.trim()) return warn('products', 'Please select or enter a product.');
      if (!field('qty').value.trim() || number('qty') <= 0) return warn('qty', 'Please enter a quantity greater than zero.');
      if (!field('unit-price').value.trim() || number('unit-price') <= 0) return warn('unit-price', 'Please enter a unit price greater than zero.');
      if (number('disc-per') < 0 || number('disc-per') > 100) return warn('disc-per', 'Discount must be between 0 and 100%.');
      if (number('vat-per') < 0) return warn('vat-per', 'VAT cannot be negative.');
      const pid = field('pid').value.trim();
      if (pid && pid !== '0' && Array.from(body.rows).some(row => row.cells[12]?.textContent === pid)) {
        return warn('products', 'This product is already in the quotation.');
      }
      if (!pid || pid === '0') return warn('products', 'Please select a product from the search results.');
      calculate();
      const row = document.createElement('tr');
      const names = ['products', 'qty', 'i-size', 'i-ral', 'i-unit', 'unit-price',
        'disc-per', 'vat-per', 'taxable', 'vat-total', 'unit-total', 'pid',
        'a-stock', 'i-cost', 'u-cost', 's-value', 'u-margin'];
      const values = [String(body.rows.length + 1), ...names.map(name => field(name).value), 'Pending'];
      values.forEach((value, index) => {
        const cell = document.createElement('td');
        cell.textContent = value;
        cell.className = index === 1 ? 'text-start' : 'text-end';
        if (index === 0 || index === 2) cell.className = 'text-center';
        // Use quotation-specific classes so invoice summary selectors stay isolated.
        cell.classList.add('quotation-row-' + (index === 0 ? 'sr-no' : index === 18 ? 'status' : names[index - 1]));
        row.appendChild(cell);
      });
      row.dataset.discountAmount = field('disc-amt').value;
      row.dataset.itemCode = field('item-code').value;
      row.dataset.openStock = field('o-stock').value;
      body.appendChild(row);
      totals();
      const defaults = {products: '', 'item-code': '', qty: '1', 'i-size': '-', 'i-ral': '-',
        'i-unit': '-', 'unit-price': '0.00', 'disc-per': '0', 'vat-per': '5', pid: '',
        'o-stock': '0', 'i-cost': '0.00'};
      Object.entries(defaults).forEach(([name, value]) => { field(name).value = value; });
      calculate();
      field('products').focus();
    });
    // Keep summary values in sync if another action removes or edits a table row.
    new MutationObserver(totals).observe(body, {childList: true, subtree: true, characterData: true});
    calculate();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeEditQuotationItems);
  else initializeEditQuotationItems();
})();


//#region CREATE CO FROM SELECTED QUOTATION
// New Customer Order dates, delivery quantities, status and item editor.
 function initializeQuoteCO(){
  const modal=document.getElementById('newco-modal-overlay'),form=document.getElementById('newco-invoice-master-form');
  if(!modal||!form)return;
  const body=document.getElementById('newco-modal-items-rows'),add=document.getElementById('newco-btn-add');
  const field=n=>document.getElementById('newco-'+n),value=n=>field(n).value.trim(),num=n=>Number(value(n))||0,round=n=>Math.round((n+Number.EPSILON)*100)/100,money=n=>(Number(n)||0).toFixed(2);
  let lines=[],editing=-1;
  function colour(){const status=value('co-no').toLowerCase();field('co-no').style.backgroundColor=status==='pending'?'#dc3545':status==='partial'?'#0d6efd':'#198754';field('co-no').style.color='white';}
  field('co-no').addEventListener('input',colour);field('co-no').addEventListener('change',colour);
  function onOpen(){if(modal.style.display!=='flex')return;const date=new Date(),today=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;field('invoice-date').value=today;field('deliver-date').value=today;if(!lines.length){field('co-no').value='Pending';field('order-qty').value='0';field('deliver-qty').value='0';field('pending-qty').value='0';}colour();}
  new MutationObserver(onOpen).observe(modal,{attributes:true,attributeFilter:['style']});
  function calculate(line){
   const net=line.price*(1-line.discount/100);line.pending=line.qty-line.delivered;
   line.tax=round(net*line.qty);line.vatTotal=round(line.tax*line.vat/100);line.total=round(line.tax+line.vatTotal);
   line.deliveredTax=round(net*line.delivered);line.deliveredVat=round(line.deliveredTax*line.vat/100);line.deliveredTotal=round(line.deliveredTax+line.deliveredVat);
   line.pendingTax=round(line.tax-line.deliveredTax);line.pendingVat=round(line.vatTotal-line.deliveredVat);line.pendingTotal=round(line.total-line.deliveredTotal);
   line.unitCost=round(line.cost*line.qty);line.margin=round(line.tax-line.unitCost);line.stock=line.openStock; // Stock is informational; no deduction or product update.
   line.stockValue=round(line.stock*line.cost);
   line.status=line.delivered===0?'Pending':line.pending===0?'Delivered':'Partial';return line;
  }
  function valid(line){return !line.item||!line.pid?'Please select a product.':!Number.isSafeInteger(line.qty)||line.qty<=0?'Order Qty must be a positive whole number.':!Number.isSafeInteger(line.delivered)||line.delivered<0||line.delivered>line.qty?'Deliver Qty must be between 0 and Order Qty.':!Number.isFinite(line.price)||line.price<=0||!Number.isFinite(line.discount)||line.discount<0||line.discount>100||!Number.isFinite(line.vat)||line.vat<0?'Please check price, discount and VAT.':'';}
  function editor(){const line=calculate({item:value('products'),pid:value('pid'),qty:num('order-qty'),delivered:num('deliver-qty'),price:num('unit-price'),discount:num('disc-per'),vat:num('vat-per'),size:value('i-size'),ral:value('i-ral'),unit:value('i-unit'),cost:num('i-cost'),openStock:num('o-stock')});field('pending-qty').value=line.pending;for(const[name,val]of Object.entries({'taxable':line.tax,'vat-total':line.vatTotal,'unit-total':line.total,'disc-amt':line.price*line.discount/100,'u-cost':line.unitCost,'u-margin':line.margin,'s-value':line.stockValue}))field(name).value=money(val);field('a-stock').value=line.stock;field('a-stock').style.backgroundColor=line.stock===0?'#dc3545':'#198754';field('a-stock').style.color='#ffffff';return line;}
  window.calculateDynamicCOTotal=editor;
  function syncOrderQuantity(){
   field('deliver-qty').value=Math.min(Math.max(0,num('deliver-qty')),Math.max(0,num('order-qty')));
   field('deliver-qty').max=Math.max(0,num('order-qty'));
   editor();
  }
  function syncDeliveryQuantity(){
   const order=Math.max(0,num('order-qty')),entered=Number(field('deliver-qty').value);
   if(Number.isFinite(entered)&&field('deliver-qty').value!=='')field('deliver-qty').value=Math.min(order,Math.max(0,entered));
   editor();
  }
  for(const event of ['input','change']){
   field('order-qty').addEventListener(event,syncOrderQuantity);
   field('deliver-qty').addEventListener(event,syncDeliveryQuantity);
  }
  field('order-qty').step='1';field('deliver-qty').type='number';field('deliver-qty').min='0';field('deliver-qty').step='1';
  for(const name of ['unit-price','disc-per','vat-per','i-cost','o-stock'])field(name).addEventListener('input',editor);
  field('pending-qty').readOnly=true;
  function totals(){
   const sum=k=>round(lines.reduce((n,line)=>n+line[k],0));
   for(const[name,key]of Object.entries({'taxable-value':'tax','total-vat':'vatTotal','grand-total':'total','pending-taxable-value':'pendingTax','pending-total-vat':'pendingVat','pending-grand-total':'pendingTotal','delivered-taxable-value':'deliveredTax','delivered-total-vat':'deliveredVat','delivered-grand-total':'deliveredTotal','t-cost':'unitCost','t-margin':'margin'}))field(name).value=money(sum(key));
   field('amount-in-words').value=toWordsConfig.convert(sum('total'));
   field('co-no').value=lines.length&&lines.every(line=>line.status==='Delivered')?'Delivered':lines.every(line=>line.status==='Pending')?'Pending':'Partial';colour();
  }
  const rowMenu=document.createElement('div');rowMenu.id='newco-items-context-menu';rowMenu.style.display='none';rowMenu.setAttribute('role','menu');
  for(const [action,label]of [['EDIT','Edit this Item'],['DELETE','Delete this Item']]){const button=document.createElement('button');button.type='button';button.dataset.action=action;button.textContent=label;button.setAttribute('role','menuitem');rowMenu.appendChild(button);}document.body.appendChild(rowMenu);
  let menuRow=-1,holdTimer=null;
  function hideRowMenu(){rowMenu.style.display='none';}
  function showRowMenu(index,x,y){if(!lines[index])return;menuRow=index;rowMenu.style.display='block';rowMenu.style.left=Math.max(6,Math.min(x,innerWidth-rowMenu.offsetWidth-6))+'px';rowMenu.style.top=Math.max(6,Math.min(y,innerHeight-rowMenu.offsetHeight-6))+'px';}
  rowMenu.addEventListener('click',event=>{const action=event.target.closest('[data-action]')?.dataset.action;hideRowMenu();if(!lines[menuRow])return;if(action==='EDIT')openItem(menuRow);else if(action==='DELETE'&&confirm('Delete this Customer Order item?')){lines.splice(menuRow,1);menuRow=-1;closeItem();render();totals();}});
  document.addEventListener('pointerdown',event=>{if(!event.target.closest('#newco-items-context-menu'))hideRowMenu();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')hideRowMenu();});
  window.addEventListener('resize',hideRowMenu);

  function render(){body.replaceChildren();lines.forEach((line,index)=>{
   const row=document.createElement('tr'),values=[index+1,line.item,line.qty,line.delivered,line.pending,line.size,line.ral,line.unit,money(line.price),line.discount,line.vat,money(line.tax),money(line.vatTotal),money(line.deliveredTax),money(line.total),line.pid,line.stock,money(line.cost),money(line.unitCost),money(line.stockValue),money(line.margin),line.status];
   row.dataset.pid=line.pid;row.dataset.status=line.status;row.classList.add('co-row-'+line.status.toLowerCase());
   values.forEach((val,column)=>{const cell=document.createElement('td');cell.textContent=val??'';if(column===3){cell.textContent='';const input=document.createElement('input');input.type='number';input.min='0';input.max=line.qty;input.step='1';input.value=line.delivered;input.className='form-control form-control-sm';input.setAttribute('aria-label','Deliver Qty for row '+(index+1));input.addEventListener('input',()=>{const amount=Number(input.value);if(input.value.trim()===''||!Number.isSafeInteger(amount))return;if(amount<0||amount>line.qty){input.value=line.delivered;alert('Deliver Qty must be between 0 and Order Qty.');return;}line.delivered=amount;calculate(line);row.classList.remove('co-row-delivered','co-row-pending','co-row-partial');row.classList.add('co-row-'+line.status.toLowerCase());row.dataset.status=line.status;for(const[col,val]of [[4,line.pending],[13,money(line.deliveredTax)],[16,line.stock],[19,money(line.stockValue)],[21,line.status]])row.cells[col].textContent=val;totals();});
            input.addEventListener('change',()=>{const quantity=Number(input.value);if(input.value.trim()===''||!Number.isSafeInteger(quantity)||quantity<0||quantity>line.qty){alert('Deliver Qty cannot be negative or exceed Order Qty.');input.value=line.delivered;return;}line.delivered=quantity;calculate(line);render();totals();});cell.appendChild(input);}row.appendChild(cell);});
   row.addEventListener('dblclick',event=>{if(!event.target.closest('input,button')){event.stopPropagation();openItem(index);}});row.addEventListener('contextmenu',event=>{event.preventDefault();event.stopPropagation();clearTimeout(holdTimer);showRowMenu(index,event.clientX,event.clientY);});
        let touchStart;
        row.addEventListener('pointerdown',event=>{
          if(event.pointerType==='mouse'||event.target.closest('input,button'))return;
          touchStart={x:event.clientX,y:event.clientY};clearTimeout(holdTimer);
          holdTimer=setTimeout(()=>showRowMenu(index,event.clientX,event.clientY),550);
        });
        row.addEventListener('pointermove',event=>{if(touchStart&&Math.hypot(event.clientX-touchStart.x,event.clientY-touchStart.y)>10)clearTimeout(holdTimer);});
        for(const type of ['pointerup','pointercancel'])row.addEventListener(type,()=>clearTimeout(holdTimer));
        body.appendChild(row);
  });}
  add.addEventListener('click',()=>{const line=editor(),error=valid(line);if(error)return alert(error);if(lines.some(old=>old.pid===line.pid))return alert('This product is already in the order.');lines.push(line);render();totals();for(const[name,val]of Object.entries({products:'','item-code':'',pid:'','order-qty':0,'deliver-qty':0,'unit-price':0,'disc-per':0,'vat-per':5,'i-cost':0,'o-stock':0}))field(name).value=val;editor();});
  const itemModal=document.getElementById('newcoitems-modal-overlay'),itemField=n=>document.getElementById('newcoitems-'+n);
  function closeItem(){itemModal.style.display='none';editing=-1;}
  function itemDraft(){if(editing<0)return null;const line=calculate({...lines[editing],qty:Number(itemField('qty').value),delivered:Number(itemField('delivery-qty').value),price:Number(itemField('unit-price').value),discount:Number(itemField('disc-per').value),vat:Number(itemField('vat-per').value),size:itemField('i-size').value,ral:itemField('i-ral').value,unit:itemField('i-unit').value});for(const[name,val]of Object.entries({'taxable':line.tax,'vat-total':line.vatTotal,'unit-total':line.total,'disc-amt':line.price*line.discount/100,'u-cost':line.unitCost,'u-margin':line.margin,'s-value':line.stockValue}))itemField(name).value=money(val);itemField('a-stock').value=line.stock;itemField('a-stock').style.backgroundColor=line.stock===0?'#dc3545':'#198754';itemField('a-stock').style.color='#ffffff';itemField('delivery-qty').max=line.qty;return line;}
  function openItem(index){editing=index;const line=lines[index];document.getElementById('newcoitems-title-text').textContent='Edit Row - Sr No- '+(index+1);for(const[name,key]of Object.entries({product:'item',pid:'pid',qty:'qty','delivery-qty':'delivered','unit-price':'price','disc-per':'discount','vat-per':'vat','i-size':'size','i-ral':'ral','i-unit':'unit','i-cost':'cost','o-stock':'openStock'}))itemField(name).value=line[key];itemField('sr-number').value=index+1;itemDraft();document.getElementById('newcoitems-transaction-form').classList.toggle('show-secret',form.classList.contains('show-secret'));itemModal.style.display='flex';}
  itemField('qty').addEventListener('input',()=>{itemField('delivery-qty').value=Math.min(Number(itemField('delivery-qty').value)||0,Number(itemField('qty').value)||0);itemDraft();});
  itemField('delivery-qty').addEventListener('input',()=>{const order=Math.max(0,Number(itemField('qty').value)||0),amount=Number(itemField('delivery-qty').value);if(Number.isFinite(amount))itemField('delivery-qty').value=Math.min(order,Math.max(0,amount));itemDraft();});
  for(const name of ['unit-price','disc-per','vat-per'])itemField(name).addEventListener('input',itemDraft);
  itemModal.querySelectorAll('.btn-cancel').forEach(button=>button.addEventListener('click',closeItem));
  document.getElementById('newcoitems-update-button').addEventListener('click',()=>{const line=itemDraft();if(!line)return;const error=valid(line);if(error)return alert(error);lines[editing]=line;closeItem();render();totals();});
  // Save New Customer Order. Status is computed; the field labelled STATUS is not the CO number.
  const saveCO=document.getElementById('btn-save-newco');let savingCO=false,coRequestId='';
  saveCO.addEventListener('click',async()=>{
   if(savingCO)return;
   for(const[name,label]of [['customer','Customer'],['emirate','Emirate'],['address','Address'],['invoice-date','CO Date']]){
    if(!value(name)){const input=field(name),section=input.closest('.invoice-mobile-section');if(section){section.classList.remove('invoice-mobile-section-closed');section.previousElementSibling?.setAttribute('aria-expanded','true');}alert(label+' is required.');input.focus();return;}
   }
   if(!lines.length)return alert('Please add at least one Customer Order item.');
   for(const line of lines){const error=valid(line);if(error)return alert(error);}
   totals();
   const mapping={Customer:'customer',Emirate:'emirate',Address:'address',PostBox:'postbox',VatID:'vat-no',CODate:'invoice-date',
    LPONo:'lpo-no',CustContact:'contact-person',CustConNumber:'contact-number',Description:'notes',InWords:'amount-in-words',ProjectName:'project-name',DeliveryDate:'deliver-date',PaymentTerms:'payment-terms'};
   const main=Object.fromEntries(Object.entries(mapping).map(([key,name])=>[key,value(name)]));
   main.OurContact=field('our-contact')?.value??'';main.OurNumber=field('our-number')?.value??'';
   const items=lines.map((line,index)=>({SrNo:index+1,Item:line.item,PID:line.pid,Quantity:line.qty,DQuantity:line.delivered,
    UnitPrice:line.price,Discount:line.discount,VatPer:line.vat,IUnit:line.unit,IRAL:line.ral,ISize:line.size}));
   coRequestId ||= window.crypto?.randomUUID?.()||(Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
   savingCO=true;saveCO.disabled=true;saveCO.textContent='Saving…';let allocatedNumber;
   try{
    const response=await fetch('/api/save-newco',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({main,items,requestId:coRequestId})});
    const result=await response.json();if(!response.ok||!result.success)throw Error(result.message||result.error||'Unable to save Customer Order.');
    allocatedNumber=result.allocatedNumber;
   }catch(error){alert('Could not save Customer Order: '+error.message);return;}
   finally{savingCO=false;saveCO.disabled=false;saveCO.textContent='Save';}
   // From here onward the order is saved, so navigation failures must not ask for another save.
   try{
    closeQuotationCO();form.reset();lines=[];body.replaceChildren();coRequestId='';closeItem();
    const host=window.parent||window,parentDoc=host.document;
    host.setActiveSidebarItem?.('/customerorders');
    const menu=parentDoc.getElementById('menu-customerorders'),button=parentDoc.getElementById('btn-customerorders');
    if(button&&(!menu||menu.style.display!=='block'))button.click();parentDoc.getElementById('view-customerorders')?.click();
    const frame=parentDoc.getElementById('main-content-viewport')||parentDoc.querySelector('iframe[name="content-frame"]');if(frame)frame.src='/customerorders';
   }catch(error){console.error('Customer Order saved, but view refresh failed:',error);}
   alert('Success! Customer Order saved as No: '+allocatedNumber);
  });

  // A cancelled/closed New CO must not leave model rows behind after form reset.
  new MutationObserver(()=>{if(modal.style.display==='none'){lines=[];coRequestId='';body.replaceChildren();closeItem();}}).observe(modal,{attributes:true,attributeFilter:['style']});
  {
  const modalPrefix='newco',fieldPrefix='newco',title='New Customer Order';
  modal.firstElementChild?.firstElementChild?.classList.add('mobile-entry-head');
  const heading = modal.querySelector('h4');
  if (heading) heading.dataset.mobileTitle = title;
  const rows = Array.from(form.children).filter(el => el.tagName === 'DIV');
  const titles = ['Customer details', 'Contact Details', 'Add an item', 'Item totals, notes & costs'];
  rows.slice(0, 4).forEach((row, i) => {
    row.classList.add('invoice-mobile-section');
    row.id ||= modalPrefix + '-mobile-section-' + i;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'invoice-mobile-section-toggle';
    button.textContent = titles[i];
    button.setAttribute('aria-controls', row.id);
    function setOpen(open) {
      row.classList.toggle('invoice-mobile-section-closed', !open);
      button.setAttribute('aria-expanded', String(open));
    }
    button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
    setOpen(false);
    row.before(button);
  });
  const totals = rows.find(row => row.querySelector('#' + fieldPrefix + '-grand-total'));
  const table = rows.find(row => row.querySelector('#' + fieldPrefix + '-invoice-table'));
  if (table) table.classList.add('invoice-mobile-table-section');
  if (totals) {
    totals.classList.add('invoice-mobile-totals');
    ['pid', 'o-stock', 'a-stock', 'amount-in-words'].map(suffix => fieldPrefix + '-' + suffix).forEach(id => {
      document.getElementById(id)?.parentElement.classList.add('invoice-mobile-stock-field');
    });
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'invoice-mobile-stock-toggle';
    button.textContent = 'Stock & amount in words';
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', () => {
      const open = totals.classList.toggle('invoice-mobile-stock-open');
      button.setAttribute('aria-expanded', String(open));
    });
    totals.prepend(button);
  }
  // Reveal collapsed sections if native validation needs to focus a field.
  form.addEventListener('invalid', event => {
    const row = event.target.closest('.invoice-mobile-section');
    if (row) {
      row.classList.remove('invoice-mobile-section-closed');
      row.previousElementSibling?.setAttribute('aria-expanded', 'true');
    }
  }, true);

  }
  let quoteCOLoading=false,secretTimer=null;
  const table=document.getElementById('newco-invoice-table');
  const countdown=document.getElementById('newco-countdown-seconds');
  function hideCOSecrets(){form.classList.remove('show-secret');table.classList.remove('show-secret');document.getElementById('newcoitems-transaction-form').classList.remove('show-secret');if(secretTimer)clearTimeout(secretTimer);secretTimer=null;if(countdown)countdown.style.display='none';}
  function resetSecretTimer(){if(secretTimer)clearTimeout(secretTimer);if(countdown){countdown.textContent='30';countdown.style.display='block';}secretTimer=setTimeout(hideCOSecrets,30000);}
  form.addEventListener('dblclick',event=>{if(event.target.closest('input,button,select,textarea,table'))return;if(form.classList.contains('show-secret'))return hideCOSecrets();const password=prompt('Enter manager password to view restricted columns:');if(password==='admin123'){form.classList.add('show-secret');table.classList.add('show-secret');resetSecretTimer();}else if(password!==null)alert('Incorrect password. Access denied.');});
  for(const type of ['pointerdown','input','keypress'])form.addEventListener(type,()=>{if(form.classList.contains('show-secret'))resetSecretTimer();});
  function closeQuotationCO(){if(savingCO)return;hideCOSecrets();hideRowMenu();closeItem();modal.style.display='none';window.parent?.lockSidebarAndRefresh?.(false);}
  modal.querySelectorAll('.btn-cancel').forEach(button=>button.addEventListener('click',closeQuotationCO));
  document.getElementById('quote-context-menu').addEventListener('click',async event=>{
   if(event.target.closest('.quote-context-item')?.dataset.action!=='CREATE CO'||quoteCOLoading||savingCO)return;
   const key=String(activeSelectedQuotationNo??'').trim();if(!key)return alert('Please select a quotation first.');
   document.getElementById('quote-context-menu').style.display='none';quoteCOLoading=true;
   try{
    const response=await fetch('/api/get-quotation-details?QuotationNo='+encodeURIComponent(key)),data=await response.json();
    if(!response.ok||!data.success)throw Error(data.error||data.message||'Could not load quotation.');
    if(!Array.isArray(data.items)||!data.items.length)throw Error('This quotation has no items.');
    const master=data.master;form.reset();hideCOSecrets();coRequestId='';
    const mapping={Customer:'customer',Postbox:'postbox',Emirate:'emirate',Address:'address',VatNo:'vat-no',PaymentTerms:'payment-terms',CustContact:'contact-person',ContactNo:'contact-number',ProjectName:'project-name',OurContact:'our-contact',OurNumber:'our-number',Notes:'notes'};
    for(const[key,name]of Object.entries(mapping))if(field(name))field(name).value=master[key]??'';
    field('lpo-no').value='-';
    lines=data.items.map(item=>calculate({item:item.Item??'',pid:String(item.PID??''),qty:Number(item.Quantity)||0,delivered:0,price:Number(item.UnitPrice)||0,discount:Number(item.LessDiscount??item.Discount)||0,vat:Number(item.VatPer)||0,size:item.ISize??'-',ral:item.IRAL??'-',unit:item.IUnit??'-',cost:Number(item.LiveCost??item.Icost)||0,openStock:Number(item.LiveStockCount??item.Stock)||0}));
    field('order-qty').value=0;field('deliver-qty').value=0;field('pending-qty').value=0;
    for(const[name,val]of Object.entries({products:'','item-code':'',pid:'','unit-price':0,'disc-per':0,'vat-per':5,'i-cost':0,'o-stock':0}))field(name).value=val;
    form.querySelectorAll('.invoice-mobile-section').forEach(section=>{section.classList.add('invoice-mobile-section-closed');section.previousElementSibling?.setAttribute('aria-expanded','false');});
    editor();render();totals();window.parent?.lockSidebarAndRefresh?.(true);modal.style.display='flex';onOpen();
   }catch(error){alert('Could not create Customer Order: '+error.message);}
   finally{quoteCOLoading=false;}
  });
  editor();colour();onOpen();
 }
 initializeQuoteCO();


//#endregion

//#region CREATE INVOICE FROM SELECTED QUOTATION
  const quoteInvoiceModal = document.getElementById('quote-newinvo-modal-overlay');
  if (quoteInvoiceModal) {
    const form = document.getElementById('quote-newinvo-invoice-master-form');
    const table = document.getElementById('quote-newinv-invoice-table');
    const body = document.getElementById('quote-newinvo-modal-items-rows');
    const save = document.getElementById('btn-save-quote-newinvoice');
    const add = document.getElementById('quote-newinv-btn-add');
    const field = name => document.getElementById('quote-newinv-' + name);
    const value = name => field(name)?.value.trim() ?? '';
    const number = name => Number(value(name)) || 0;
    const round = n => Math.round((n + Number.EPSILON) * 100) / 100;
    const money = n => (Number(n) || 0).toFixed(2);
    const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
    let lines = [], editing = -1, busy = false, loading = false;
    const lockRefresh = event => { if (event.key === 'F5' || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'r')) event.preventDefault(); };
    function closeQuoteInvoice() {
      if (busy) return;
      closeItemEditor();hideItemMenu();lockQuoteInvoiceSecrets();
      quoteInvoiceModal.style.display = 'none';
      window.removeEventListener('keydown', lockRefresh);
      window.parent?.lockSidebarAndRefresh?.(false);
    }
    quoteInvoiceModal.querySelectorAll('.btn-cancel').forEach(button => {
      button.removeAttribute('onclick'); button.addEventListener('click', closeQuoteInvoice);
    });
    function calculateLine(line) {
      const discount = line.UnitPrice * line.Discount / 100;
      line.Taxable = round((line.UnitPrice - discount) * line.Quantity);
      line.VatTotal = round(line.Taxable * line.VatPer / 100);
      line.UnitTotal = round(line.Taxable + line.VatTotal);
      line.Ucost = round(line.Icost * line.Quantity);
      line.Umargin = round(line.Taxable - line.Ucost);
      line.stock = Math.max(0, line.OpenStock - line.Quantity);
      line.SValue = round(line.stock * line.Icost);
      line.CNQty = line.Quantity; // Original actual quantity when this new invoice is saved.
      return line;
    }
    function editorLine() {
      return calculateLine({Item:value('products'), PID:value('pid'), Quantity:number('qty'), UnitPrice:number('unit-price'),
        Discount:number('disc-per'), VatPer:number('vat-per'), Icost:number('i-cost'), OpenStock:number('o-stock'),
        ISize:value('i-size'), IRAL:value('i-ral'), IUnit:value('i-unit')});
    }
    function calculateEditor() {
      const line = editorLine();
      for (const [name, key] of Object.entries({'taxable':'Taxable','vat-total':'VatTotal','unit-total':'UnitTotal','u-cost':'Ucost','u-margin':'Umargin','s-value':'SValue'})) field(name).value = money(line[key]);
      field('disc-amt').value = money(line.UnitPrice * line.Discount / 100);
      field('a-stock').value = line.stock;
      return line;
    }
    window.calculateQuoteInvoiceTotal = calculateEditor;
    ['qty','unit-price','disc-per','vat-per','i-cost','o-stock'].forEach(name => {
      field(name).addEventListener('input', calculateEditor); field(name).addEventListener('change', calculateEditor);
    });
    function totals() {
      const sum = key => round(lines.reduce((total, line) => total + line[key], 0));
      for (const [name,key] of Object.entries({'taxable-value':'Taxable','total-vat':'VatTotal','grand-total':'UnitTotal','t-cost':'Ucost','t-margin':'Umargin'})) field(name).value = money(sum(key));
      field('amount-in-words').value = toWordsConfig.convert(sum('UnitTotal'));
    }
    function resetEditor() {
      editing = -1; add.textContent = 'ADD ITEM';
      for (const [name, val] of Object.entries({products:'','item-code':'',qty:1,'i-size':'-','i-ral':'-','i-unit':'-',
        'unit-price':0,'disc-per':0,'vat-per':5,'i-cost':0,'o-stock':0,pid:''})) field(name).value = val;
      calculateEditor();
    }
    function valid(line) {
      if (!line.Item || !line.PID) return 'Please select a product from the search results.';
      if (!Number.isSafeInteger(line.Quantity) || line.Quantity <= 0) return 'Quantity must be a positive whole number.';
      if (!Number.isFinite(line.UnitPrice) || line.UnitPrice <= 0) return 'Please enter a unit price greater than zero.';
      if (line.Discount < 0 || line.Discount > 100 || line.VatPer < 0) return 'Please check discount and VAT percentages.';
      return '';
    }
    function render() {
      body.replaceChildren();
      lines.forEach((line,index) => {
        const row = document.createElement('tr');
        const values = [index+1,line.Item,line.Quantity,line.CNQty,line.ISize,line.IRAL,line.IUnit,money(line.UnitPrice),
          money(line.Discount),money(line.VatPer),money(line.Taxable),money(line.VatTotal),money(line.UnitTotal),
          line.PID,line.stock,money(line.Icost),money(line.Ucost),money(line.SValue),money(line.Umargin),'Delivered'];
        values.forEach((val,column) => {
          const cell = document.createElement('td'); cell.textContent = val ?? ''; cell.className = column===1?'text-start':'text-end';
          row.appendChild(cell);
        });
        row.title='Right-click or long-press for Edit / Delete';
        row.addEventListener('dblclick',event=>{if(!event.target.closest('input,button'))openItemEditor(index);});
        row.addEventListener('contextmenu',event=>{event.preventDefault();event.stopPropagation();clearTimeout(holdTimer);showItemMenu(index,event.clientX,event.clientY);});
        let touchStart;
        row.addEventListener('pointerdown',event=>{
          if(event.pointerType==='mouse'||event.target.closest('input,button'))return;
          touchStart={x:event.clientX,y:event.clientY};clearTimeout(holdTimer);
          holdTimer=setTimeout(()=>showItemMenu(index,event.clientX,event.clientY),550);
        });
        row.addEventListener('pointermove',event=>{if(touchStart&&Math.hypot(event.clientX-touchStart.x,event.clientY-touchStart.y)>10)clearTimeout(holdTimer);});
        for(const type of ['pointerup','pointercancel'])row.addEventListener(type,()=>clearTimeout(holdTimer));
        body.appendChild(row);
      });
    }
    // Manager reveal: same password and 30-second activity timer as New Invoice.
    const secretCountdown=document.getElementById('quote-newinvo-countdown-seconds');
    let secretTimer=null, secretSeconds=30;
    function lockQuoteInvoiceSecrets() {
      form.classList.remove('show-secret'); table.classList.remove('show-secret');
      itemForm?.classList.remove('show-secret');
      secretCountdown.style.display='none';
      if(secretTimer!==null) clearInterval(secretTimer); secretTimer=null;
    }
    function refreshSecretTimer() {
      if(secretTimer!==null) clearInterval(secretTimer);
      secretSeconds=30;secretCountdown.textContent=secretSeconds;secretCountdown.style.display='block';
      secretTimer=setInterval(()=>{secretCountdown.textContent=--secretSeconds;if(secretSeconds<=0)lockQuoteInvoiceSecrets();},1000);
    }
    form.addEventListener('dblclick',event=>{
      if(event.target.closest('input,button,select,textarea,a,table'))return;
      if(form.classList.contains('show-secret'))return lockQuoteInvoiceSecrets();
      const password=prompt('Enter manager password to view restricted columns:');
      if(password==='admin123'){form.classList.add('show-secret');table.classList.add('show-secret');refreshSecretTimer();}
      else if(password!==null)alert('Incorrect password. Access denied.');
    });
    for(const activity of ['mousemove','keypress','input','pointerdown'])form.addEventListener(activity,()=>{if(form.classList.contains('show-secret'))refreshSecretTimer();});
    // Reuse the New Invoice item modal's HTML and its established responsive CSS.
    const itemModal=document.getElementById('newinvitems-modal-overlay');
    const itemForm=document.getElementById('newinvitems-transaction-form');
    const itemField=name=>document.getElementById('newinvitems-'+name);
    const itemMenu=document.getElementById('quote-invoice-items-context-menu');
    let selectedItem=-1, itemIndex=-1, holdTimer=null;
    function hideItemMenu(){itemMenu.style.display='none';}
    function closeItemEditor(){itemModal.style.display='none';itemIndex=-1;}
    function calculateItemEditor(){
      if(itemModal.dataset.owner!=='quote-invoice'||itemIndex<0||!lines[itemIndex])return null;
      const draft=calculateLine({...lines[itemIndex],Quantity:Number(itemField('qty').value),UnitPrice:Number(itemField('unit-price').value),
        Discount:Number(itemField('disc-per').value),VatPer:Number(itemField('vat-per').value),
        ISize:itemField('i-size').value,IRAL:itemField('i-ral').value,IUnit:itemField('i-unit').value});
      for(const [name,key]of Object.entries({'taxable':'Taxable','vat-total':'VatTotal','unit-total':'UnitTotal','u-cost':'Ucost','u-margin':'Umargin','s-value':'SValue'}))itemField(name).value=money(draft[key]);
      itemField('disc-amt').value=money(draft.UnitPrice*draft.Discount/100);itemField('a-stock').value=draft.stock;
      return draft;
    }
    function openItemEditor(index){
      const line=lines[index];if(!line||busy)return;hideItemMenu();itemIndex=index;itemModal.dataset.owner='quote-invoice';
      document.getElementById('newinvitems-title-text').textContent=matchMedia('(max-width: 767px)').matches?'Edit Row - Sr No- '+(index+1):'EDIT INVOICE ITEM - Sr No: '+(index+1);
      for(const [name,key]of Object.entries({product:'Item',pid:'PID',qty:'Quantity','i-size':'ISize','i-ral':'IRAL','i-unit':'IUnit',
        'unit-price':'UnitPrice','disc-per':'Discount','vat-per':'VatPer','i-cost':'Icost','o-stock':'OpenStock'}))itemField(name).value=line[key]??'';
      itemField('sr-number').value=index+1;calculateItemEditor();
      itemForm.classList.toggle('show-secret',form.classList.contains('show-secret'));
      itemModal.style.display='flex';updateItemViewport();
    }
    for(const name of ['qty','unit-price','disc-per','vat-per'])itemField(name).addEventListener('input',calculateItemEditor);
    itemModal.querySelectorAll('.btn-cancel').forEach(button=>button.addEventListener('click',closeItemEditor));
    document.getElementById('newinvitems-update-button').addEventListener('click',()=>{
      const draft=calculateItemEditor();if(!draft)return;const error=valid(draft);if(error)return alert(error);
      lines[itemIndex]=draft;closeItemEditor();resetEditor();render();totals();
    });
    for(const activity of ['pointerdown','input','keypress'])itemForm.addEventListener(activity,()=>{if(form.classList.contains('show-secret'))refreshSecretTimer();});
    function showItemMenu(index,x,y){
      if(!lines[index]||busy)return;selectedItem=index;itemMenu.style.display='block';
      itemMenu.style.left=Math.max(6,Math.min(x,innerWidth-itemMenu.offsetWidth-6))+'px';
      itemMenu.style.top=Math.max(6,Math.min(y,innerHeight-itemMenu.offsetHeight-6))+'px';
    }
    itemMenu.addEventListener('click',event=>{
      const action=event.target.closest('[data-action]')?.dataset.action;if(!action)return;
      hideItemMenu();
      if(action==='EDIT')openItemEditor(selectedItem);
      else if(action==='DELETE'&&lines[selectedItem]&&confirm('Delete this invoice item?')){
        lines.splice(selectedItem,1);selectedItem=-1;resetEditor();render();totals();
      }
    });
    document.addEventListener('pointerdown',event=>{if(!event.target.closest('#quote-invoice-items-context-menu'))hideItemMenu();});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'){hideItemMenu();if(itemModal.style.display==='flex')closeItemEditor();}});
    function updateItemViewport(){
      const viewport=window.visualViewport;
      itemModal.style.setProperty('--item-visible-height',(viewport?.height??innerHeight)+'px');
      itemModal.style.setProperty('--item-visible-top',(viewport?.offsetTop??0)+'px');
    }
    window.visualViewport?.addEventListener('resize',updateItemViewport);
    window.visualViewport?.addEventListener('scroll',updateItemViewport);
    window.addEventListener('resize',updateItemViewport);

    add.addEventListener('click', () => {
      const line=calculateEditor(), error=valid(line); if(error) return alert(error);
      if(lines.some((existing,index)=>index!==editing && String(existing.PID)===String(line.PID))) return alert('This product is already in the invoice.');
      if(editing>=0) lines[editing]=line; else lines.push(line);
      render(); totals(); resetEditor();
    });
    document.getElementById('quote-context-menu').addEventListener('click', async event => {
      if(event.target.closest('.quote-context-item')?.dataset.action!=='CREATE INVOICE' || loading || busy) return;
      const key=String(activeSelectedQuotationNo??'').trim(); if(!key) return alert('Please select a quotation first.');
      document.getElementById('quote-context-menu').style.display='none'; loading=true;
      try {
        const response=await fetch('/api/get-quotation-details?QuotationNo='+encodeURIComponent(key));
        const result=await response.json();
        if(!response.ok || !result.success) throw new Error(result.error||'Could not load quotation.');
        if(!Array.isArray(result.items) || !result.items.length) throw new Error('This quotation has no items.');
        const master=result.master;lockQuoteInvoiceSecrets();form.reset();
        const map={Customer:'customer',Postbox:'postbox',Emirate:'emirate',Address:'address',VatNo:'vat-no',PaymentTerms:'payment-terms',
          CustContact:'contact-person',ContactNo:'contact-number',ProjectName:'project-name',OurContact:'our-contact',OurNumber:'our-number',Notes:'notes'};
        Object.entries(map).forEach(([key,name])=>field(name).value=master[key]??'');
        field('invoice-date').value=today(); field('deliver-date').value=today();
        field('lpo-no').value='-'; field('co-no').value='-';
        lines=result.items.map(item=>calculateLine({Item:item.Item??'',PID:String(item.PID??''),Quantity:Number(item.Quantity)||0,
          UnitPrice:Number(item.UnitPrice)||0,Discount:Number(item.LessDiscount)||0,VatPer:Number(item.VatPer)||0,
          Icost:Number(item.LiveCost??item.Icost)||0,OpenStock:Number(item.LiveStockCount??item.Stock)||0,
          ISize:item.ISize??'-',IRAL:item.IRAL??'-',IUnit:item.IUnit??'-'}));
        quoteInvoiceModal.dataset.quotationNo=String(master.QuotationNo);
        document.getElementById('quote-newinvo-modal-title').textContent='NEW INVOICE FROM QUOTATION - '+master.QuotationNo;
        resetEditor(); render(); totals();
        window.parent?.lockSidebarAndRefresh?.(true); window.addEventListener('keydown',lockRefresh);
        quoteInvoiceModal.style.display='flex';
      } catch(error) { alert('Could not create invoice: '+error.message); }
      finally { loading=false; }
    });
    save.addEventListener('click', async () => {
      if(busy) return;
      if(!value('customer') || !value('invoice-date')) return alert('Customer and invoice date are required.');
      if(!lines.length) return alert('Please add at least one invoice item.');
      for(const line of lines) { const error=valid(line); if(error) return alert(error); }
      totals();
      const mapping={Customer:'customer',PostBox:'postbox',Emirate:'emirate',Address:'address',VatID:'vat-no',InvoiceDate:'invoice-date',
        LPONo:'lpo-no',CONo:'co-no',PaymentTerms:'payment-terms',CustContact:'contact-person',CustConNumber:'contact-number',
        ProjectName:'project-name',DeliveryDate:'deliver-date',OurContact:'our-contact',OurNumber:'our-number',Description:'notes',InWords:'amount-in-words'};
      const main=Object.fromEntries(Object.entries(mapping).map(([key,name])=>[key,value(name)]));
      for(const [key,name] of Object.entries({SubTotal:'taxable-value',VatTotal:'total-vat',GrandTotal:'grand-total',InvCost:'t-cost',InvMargin:'t-margin'})) main[key]=number(name);
      const items=lines.map((line,index)=>({...line,SrNo:index+1}));
      busy=true; save.disabled=true; save.textContent='Saving…';
      let allocated;
      try {
        const response=await fetch('/api/save-newinvoice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({main,items})});
        const result=await response.json(); if(!response.ok || !result.success) throw new Error(result.message||result.error||'Could not save invoice.');
        allocated=result.allocatedNumber;
      } catch(error) { alert('Could not save invoice: '+error.message); return; }
      finally { busy=false; save.disabled=false; save.textContent='Save'; }
      closeQuoteInvoice(); form.reset(); lines=[]; body.replaceChildren(); resetEditor(); totals();
      // Match Index New Invoice: open Invoices and select View Invoices.
      try {
        const host=window.parent || window;
        const parentDoc=host.document;
        if(typeof host.setActiveSidebarItem==='function')host.setActiveSidebarItem('/invoices');
        const button=parentDoc.getElementById('btn-invoices');
        const menu=parentDoc.getElementById('menu-invoices');
        if(button && (!menu || menu.style.display!=='block'))button.click();
        const link=parentDoc.getElementById('view-invoices');
        if(link){link.click();link.classList.add('active');}
        const frame=parentDoc.getElementById('main-content-viewport') || parentDoc.querySelector('iframe[name="content-frame"]');
        if(frame)frame.src='/invoices';
      }catch(error){console.error('Invoice saved, but invoice view could not refresh:',error);}
      alert('Success! Invoice saved as No: '+allocated);
    });
    // Mobile grouping is independent of desktop positions.
    const rows=Array.from(form.children).filter(node=>node.tagName==='DIV');
    const titles=['Customer Details','Invoice Details','Item Details','Amounts & Costs','Totals & Stock'];
    rows.filter(row=>!row.contains(table)).forEach((row,index)=>{
      row.classList.add('quote-invoice-section','is-closed');
      const toggle=document.createElement('button'); toggle.type='button'; toggle.className='quote-invoice-toggle';
      toggle.textContent=titles[index]||'Details'; toggle.setAttribute('aria-expanded','false');
      toggle.addEventListener('click',()=>{const open=row.classList.toggle('is-closed')===false;toggle.setAttribute('aria-expanded',String(open));});
      row.before(toggle);
    });
    rows.find(row=>row.contains(table))?.classList.add('quote-invoice-table-section');
    form.addEventListener('invalid',event=>{const section=event.target.closest('.quote-invoice-section');if(section){section.classList.remove('is-closed');section.previousElementSibling?.setAttribute('aria-expanded','true');}},true);
  }
//#endregion

}

//#endregion 
//==========================================================================================//

//============================DELIVERY ORDERS==============================================//
//#region 📌 DELIVERY ORDERS CODE ALL INSERT HERE
function initDeliveryOrderPage() {
  let TotalQuote = "";

//#region  LOAD DELIVERY ORDERS FROM DATABASE
              const btnDoSearch = document.getElementById("btn-do-search");
              if (!btnDoSearch) return;               
              fetchFilteredDeliveryOrders();
//#endregion

//#region  DELIVERY ORDER SEARCH BUTTON CLICK EVENT
             btnDoSearch.addEventListener("click", fetchFilteredDeliveryOrders);

              //================ SEARCH EVENTS FOR RANGE, STATUS, QUOTATION NUMBER, CUSTOMER NAME ====================//
              document.getElementById("filter-do-range").addEventListener("change", (event) => 
                {
                   // Clear manual parameters so they don't override the dropdown choice
                    document.getElementById("filter-do-start-date").value = "";
                    document.getElementById("filter-do-end-date").value = "";
                    fetchFilteredDeliveryOrders();
                });
              // document.getElementById("filter-do-status").addEventListener("change", (event) => 
              //   {
                  
              //     fetchFilteredDeliveryOrders();
              //   });
              // document.getElementById("search-do-no").addEventListener("input", () => 
              //   {
                  
              //     fetchFilteredDeliveryOrders();
              //   });
              document.getElementById("search-do-customer").addEventListener("input", () => 
                {
                  
                  fetchFilteredDeliveryOrders();
                });
//#endregion

//#region  FETCH DELIVERY ORDERS FROM DATABASE FUNCTION
              
              function fetchFilteredDeliveryOrders() {
                document.getElementById("do-head").textContent = `Delivery Orders Registry`;
                const doloadingOverlay = document.getElementById("do-loading-overlay");
                const dotableBlock = document.getElementById("do-table-display-block");
                const dotbody = document.getElementById("do-rows");
                
                doloadingOverlay.style.display = "block";
                dotableBlock.style.opacity = "0.4";

                const payload = {
                  // DONo: document.getElementById("search-do-no").value.trim(),
                  searchQuery: document.getElementById("search-do-customer").value.trim(),
                  // Status: document.getElementById("filter-quote-status").value,
                  timeRange: document.getElementById("filter-do-range").value,
                  startDate: document.getElementById("filter-do-start-date").value,
                  endDate: document.getElementById("filter-do-end-date").value,
                };
                //console.log("[ERP DEBUG] Credit Notes Data Retrieved:", payload);

                fetch("/api/deliveryorders", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                  
                })
                
                  .then((res) => res.json())
                  .then((data) => { 
                    // console.log("[ERP DEBUG] Credit Notes Data Retrieved:", data.creditnotes);
                    dotbody.innerHTML = "";
                    doloadingOverlay.style.display = "none";
                    dotableBlock.style.opacity = "1.0";
                    
                    //TotalQuote = data.deliveryorders.length;//total deliveryorders count
                    if (
                      !data.success || !data.deliveryorders || data.deliveryorders.length === 0) {
                      
                      dotbody.innerHTML =
                        '<tr><td colspan="13" class="text-center text-muted py-3">No matching Delivery Orders records found inside database registry.</td></tr>';
                      return;
                      
                    }
                    TotalDO = "";
                    TotalDO = data.deliveryorders.length;//total deliveryorders count
                                       // 1. Extract all dates and convert them to timestamps
                    const timestamps = data.deliveryorders.map(deliveryorder => new Date(deliveryorder.DODate).getTime());
                    // 2. Find the minimum and maximum timestamps
                    const minTimestamp = Math.min(...timestamps);
                    const maxTimestamp = Math.max(...timestamps);   
                    const now = new Date();                 
                    document.getElementById("do-head").innerHTML = `Delivery Orders (${TotalDO})`;
                    document.getElementById("do-head-date").innerHTML = formatToDdMMMyyyy(now);
                    
                    // 💡 DYNAMICALLY UPDATE THE DATE PICKERS FOR DELIVERY ORDERS
                    if (data.computedDates.from) {
                        document.getElementById("filter-do-start-date").value = data.computedDates.from;
                    } else {
                        document.getElementById("filter-do-start-date").value = ""; // Clear if FULL history selection
                    }

                    if (data.computedDates.to) {
                        document.getElementById("filter-do-end-date").value = data.computedDates.to;
                    } else {
                        document.getElementById("filter-do-end-date").value = ""; // Clear if FULL history selection
                    }

                    data.deliveryorders.forEach((dorder) => {
                      const row = document.createElement("tr");
                      // TotalDO = dorder.length;//total quotations count
                      // 2. 💡 CRITICAL FIX: Set your data markers directly onto the element object wrapper!
                      row.setAttribute('data-id', dorder.ID || "");
                      row.setAttribute('data-dono', dorder.DONo || "");
                      let badgeClass = "text-danger";
                      let rowTextColorStyle = ""; // 🎯 Holder for row inline color styles
                      // 2. 🎨 MAP ROW TEXT COLOR DIRECTLY TO FINANCIAL REGISTRY STATUSES
                      const DOTypeValues = (dorder.QuoteType || "DELIVERY ORDERS").toUpperCase();

                      // if (DOTypeValues === "QUOTATION") {
                      //   //badgeClass = "bg-success";
                      //   rowTextColorStyle = "color: blue;"; // green
                      // } else if (DOTypeValues === "QUOTATION (Revised)" || DOTypeValues === "QUOTATION (REVISED)") {
                      //   //badgeClass = "bg-warning text-dark";
                      //   rowTextColorStyle = "color: red;"; // red
                      // } else if (DOTypeValues === "QUOTATION (Final)" || DOTypeValues === "QUOTATION (FINAL)") {
                      //   badgeClass = "bg-info text-dark";
                      //   rowTextColorStyle = "color: green;"; // purple
                      //  } 
                      //else if (
                      //   quoteTypeValues === "ADV.PAID" ||
                      //   quoteTypeValues === "ADVANCE PAID"
                      // ) {
                      //   badgeClass = "bg-danger";
                      //   rowTextColorStyle = "color: blue;"; //  blue text row
                      // }
                      // 3. Inject the style attribute directly into the opening <tr> element node
                      if (rowTextColorStyle) {
                        row.setAttribute("style", rowTextColorStyle);
                      }
                      
                      row.innerHTML = `
                        
                        <td class="col-width-id">${dorder.ID || "N/A"}</td> <!-- 🎯 ADDED CLASS HERE TO HIDE CELL -->
                        <td class="col-width-sd"style="text-align: center;">${dorder.DONo || "N/A"}</td>
                        <td class="col-width-sd"style="text-align: center;">${formatToDdMMMyyyy(dorder.DODate)}</td>
                        <td class="col-width-sd" style="text-align: center;">${dorder.InvoiceNo || "N/A"}</td>
                        <td class="col-width-sd" style="text-align: center;">${dorder.LPONo || "N/A"}</td>
                        <td class="col-width-customer">${dorder.Customer || "CASH"}</td>
                        <td class="col-width-sd" style="text-align: center;">${dorder.Emirate || "ABU DHABI"}</td>
                        <td class="col-width-sd" style="text-align: center;">${formatToDdMMMyyyy(dorder.DeliveryDate)}</td>
                        <td class="col-width-sm" style="text-align: center;">${dorder.User_name || "-"}</td>
                        
                    `;
                      dotbody.appendChild(row);
                    });
                    
                  })
                  .catch((err) => {
                    console.error("Critical rendering pipeline issue:", err);
                    doloadingOverlay.style.display = "none";
                    dotableBlock.style.opacity = "1.0";
                    dotbody.innerHTML =
                      '<tr><td colspan="13" class="text-center text-danger py-3">Error streaming dataset values. Check server connection metrics.</td></tr>';
                  });
                  
              }
              // 🎯 GLOBAL STORAGE TRACKER FOR THE ACTIVE SELECTED CREDIT NOTE DATA
              let activeSelectedDONo = null;
              let activeSelectedDOId = null;
              
//#endregion

//#region  BUTTON DELIVERY ORDERS RESET CLICK EVENT
              document.getElementById("btn-do-reset").addEventListener("click", () => 
                {
                  // document.getElementById("search-do-no").value = "";
                  document.getElementById("search-do-customer").value = "";
                  // document.getElementById("filter-do-status").value = "ALL";
                  document.getElementById("filter-do-range").value = "3MONTH";
                  document.getElementById("filter-do-start-date").value = "";
                  document.getElementById("filter-do-end-date").value = "";
                  fetchFilteredDeliveryOrders();
                });
//#endregion ============ END BUTTON RESET CLICK EVENT ===================================//

//#region  OPEN DELIVERY ORDERS DYNAMIC CONTEXT MENU
              document.getElementById("do-rows").addEventListener("contextmenu", function (e) {
                  const clickedRow = e.target.closest("tr");
                  if (!clickedRow) return;
                  // const cells = clickedRow.getElementsByTagName("td");
                  // if (!cells || cells.length < 13) return; // Ignore loose spaces or empty rows
                  e.preventDefault();
                  // ⚡ INSTANT READ: Bypasses innerText geometry checks completely!
                  activeSelectedDOId = clickedRow.getAttribute("data-id") || "";
                  activeSelectedDONo = clickedRow.getAttribute("data-dono") || "";
                  //console.log(`[ERP DEBUG] Fast Lock: ${activeSelectedCreditNoteNo}`);
                  // 🎯 THE FRONTEND FIX: Read InvoiceNo directly out of index cell 1
                  // Index 0 is hidden ID, Index 1 is Invoice Number string
                  // activeSelectedInvoiceId = cells[0].innerText.trim() || cells[0].textContent.trim();
                  // activeSelectedInvoiceNo = cells[1].innerText.trim() || cells[1].textContent.trim();
                  // Clean any trailing tags or line breaks from the invoice number string
                  activeSelectedDONo = activeSelectedDONo.replace(/<[^>]*>/g, "").trim();
                  //console.log(`[ERP DEBUG] Fast Lock: ${activeSelectedQuotationNo}`);
                // ⚡ OPTIMIZATION 1: Clear ONLY the single previously highlighted row instead of looping through all rows
                const oldHighlightedRow = document.querySelector("#do-rows tr.do-rows-highlight-context");
                if (oldHighlightedRow) {
                  oldHighlightedRow.classList.remove("do-rows-highlight-context");
                }
                clickedRow.classList.add("do-rows-highlight-context");

                const menuElement = document.getElementById("do-context-menu");
                // ⚡ OPTIMIZATION 2: Pre-set display styles before reading geometric layout sizes
                menuElement.style.visibility = "hidden"; // Render invisibly first so it takes shape in the DOM
                menuElement.style.display = "block";


                  // Highlight row visually
                  // document.querySelectorAll("#invoice-rows tr").forEach((row) => row.classList.remove("invoices-row-highlight-context"),);
                  // clickedRow.classList.add("invoices-row-highlight-context");

                  //const menuElement = document.getElementById("invoices-context-menu",);
                  
                  // menuElement.style.display = "block";
                  //menuElement.style.left = e.clientX + "px";
                  //menuElement.style.top = e.clientY + "px";
                  // 2. Get your monitor window sizes and menu sizes
                const menuWidth = menuElement.offsetWidth || 150;
                const menuHeight = menuElement.offsetHeight || 120;
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;

                // 3. Calculate ideal X (Horizontal) Position
                // If opening to the right goes off-screen, flip it to open to the left
                let targetX = e.clientX;
                if (e.clientX + menuWidth > windowWidth) {
                  targetX = windowWidth - menuWidth - 10; // 10px safety margin from window edge
                }
                
                // 4. Calculate ideal Y (Vertical) Position
                // If opening downward goes off-screen, flip it to open upward instead!
                let targetY = e.clientY;
                if (e.clientY + menuHeight > windowHeight) {
                  targetY = e.clientY - menuHeight; // Shifts the menu completely above your cursor
                  
                  // Safety check: if it hits the absolute top of the viewport
                  if (targetY < 0) targetY = 10; 
                }
                
                // 5. Apply the safe, un-clipped coordinates
                menuElement.style.left = targetX + "px";
                menuElement.style.top = targetY + "px";
                menuElement.style.visibility = "visible"; 
                e.stopPropagation();
                });

              // 🎯 HIDE MENU SCRIPT: Closes popup if user clicks anywhere else on screen
              document.addEventListener("click", function (e) {
                const menuElement = document.getElementById(
                  "do-context-menu",
                );
                if (!e.target.closest("#do-context-menu")) {
                  menuElement.style.display = "none";
                  document
                    .querySelectorAll("#do-rows tr")
                    .forEach((row) =>
                      row.classList.remove("do-rows-highlight-context"),
                    );
                }
              });
//#endregion

//#region     RIGHT CLICK CONTEXT MENU ACTIONS  DELIVERY ORDERS
            
              const DOcontextMenuItems = document.querySelectorAll(".do-context-item");
              DOcontextMenuItems.forEach((item) => {
                item.addEventListener("click", (e) => {
                  const actionType = e.currentTarget.getAttribute("data-action");
                  if (actionType) {
                    DOMenuAction(actionType);
                  }
                });
              });              
              function DOMenuAction(actionType) {
                document.getElementById("do-context-menu").style.display = "none";

                const targetRow = document.querySelector(".do-rows-highlight-context",);
                if (!targetRow) return;
                const cells = targetRow.getElementsByTagName("td");
                
                //PRINT DO
                if (actionType === "PRINT DO") {
                  // Guard clause check to ensure a unique record number is locked down in memory tracking variables
                if (!activeSelectedDONo) {
                  alert("Error: Select valid DO row for print out.");
                  return;
                }
                // Using window.location.href automatically acts as a silent execution file generation layer download trigger
                window.location.href = `/api/print-deliveryorder/${encodeURIComponent(activeSelectedDONo)}`;
                } 


    }//function end
    //#endregion

//#region  FORMAT DATE TO DISPLAY DD-MMM-YYYY
              function formatToDdMMMyyyy(dateString) {
                if (!dateString) return "N/A";
                const dateObj = new Date(dateString);
                if (isNaN(dateObj.getTime())) return "N/A";
                const day = String(dateObj.getDate()).padStart(2, "0");
                const yy = String(dateObj.getFullYear()).slice(-2);
                const months = [
                  "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",
                ];
                return (
                  day + "-" + months[dateObj.getMonth()] + "-" + yy
                );
              }
//#endregion ============ END FORMAT DATE TO DISPLAY DD-MMM-YYYY===================================//

}
//#endregion 
//==========================================================================================//

//============================LOCAL PURCHASE ORDERS==============================================//
//#region 📌 LOCAL PURCHASE ORDERS CODE ALL INSERT HERE

function initLPOPage() {
  let TotalLpo = "";

//#region  LOAD LPO FROM DATABASE
              const btnlpoSearch = document.getElementById("btn-lpo-search");
              if (!btnlpoSearch) return;               
              fetchFilteredLPO();
//#endregion

//#region  LPO SEARCH BUTTON CLICK EVENT
             btnlpoSearch.addEventListener("click", fetchFilteredLPO);

              //================ SEARCH EVENTS FOR RANGE, STATUS, QUOTATION NUMBER, CUSTOMER NAME ====================//
              document.getElementById("filter-lpo-range").addEventListener("change", (event) => 
                {
                    document.getElementById("filter-lpo-start-date").value = "";
                    document.getElementById("filter-lpo-end-date").value = "";
                    fetchFilteredLPO();
                });
              // document.getElementById("filter-lpo-status").addEventListener("change", (event) => 
              //   {
                  
              //     fetchFilteredLPO();
              //   });
              // document.getElementById("search-lpo-no").addEventListener("input", () => 
              //   {
                  
              //     fetchFilteredLPO();
              //   });
              document.getElementById("search-lpo-customer").addEventListener("input", () => 
                {
                  
                  fetchFilteredLPO();
                });
//#endregion

//#region  FETCH LPO FROM DATABASE FUNCTION
              
              function fetchFilteredLPO() {
                document.getElementById("lpo-head").textContent = `LPO Registry`;
                const lpoloadingOverlay = document.getElementById("lpo-loading-overlay");
                const lpotableBlock = document.getElementById("lpo-table-display-block");
                const lpotbody = document.getElementById("lpo-rows");
                
                lpoloadingOverlay.style.display = "block";
                lpotableBlock.style.opacity = "0.4";

                const payload = {
                  // LPONumber: document.getElementById("search-lpo-no").value.trim(),
                  searchQuery: document.getElementById("search-lpo-customer").value.trim(),
                  // Status: document.getElementById("filter-lpo-status").value,
                  timeRange: document.getElementById("filter-lpo-range").value,
                  startDate: document.getElementById("filter-lpo-start-date").value,
                  endDate: document.getElementById("filter-lpo-end-date").value,
                };
                //console.log("[ERP DEBUG] Credit Notes Data Retrieved:", payload);

                fetch("/api/purchaseorders", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                  
                })
                
                  .then((res) => res.json())
                  .then((data) => { 
                    // console.log("[ERP DEBUG] Credit Notes Data Retrieved:", data.creditnotes);
                    lpotbody.innerHTML = "";
                    lpoloadingOverlay.style.display = "none";
                    lpotableBlock.style.opacity = "1.0";
                    
                    //TotalQuote = data.purchaseorders.length;//total purchaseorders count
                    if (
                      !data.success || !data.purchaseorders || data.purchaseorders.length === 0) {
                      
                      lpotbody.innerHTML =
                        '<tr><td colspan="13" class="text-center text-muted py-3">No matching purchaseorders records found inside database registry.</td></tr>';
                      return;
                      
                    }
                    TotalLpo = "";
                    TotalLpo = data.purchaseorders.length;//total quotations count
                                       // 1. Extract all dates and convert them to timestamps
                    const timestamps = data.purchaseorders.map(purchaseorder => new Date(purchaseorder.LPODate).getTime());
                    // 2. Find the minimum and maximum timestamps
                    const minTimestamp = Math.min(...timestamps);
                    const maxTimestamp = Math.max(...timestamps);                    
                    document.getElementById("lpo-head").innerHTML = `Purchase Orders (${TotalLpo})`;
                    const now = new Date();
                    document.getElementById("lpo-head-date").innerHTML = formatToDdMMMyyyy(now);
                    // 💡 DYNAMICALLY UPDATE THE DATE PICKERS FOR DELIVERY ORDERS
                    if (data.computedDates.from) {
                        document.getElementById("filter-lpo-start-date").value = data.computedDates.from;
                    } else {
                        document.getElementById("filter-lpo-start-date").value = ""; // Clear if FULL history selection
                    }

                    if (data.computedDates.to) {
                        document.getElementById("filter-lpo-end-date").value = data.computedDates.to;
                    } else {
                        document.getElementById("filter-lpo-end-date").value = ""; // Clear if FULL history selection
                    }

                    data.purchaseorders.forEach((lpo) => {
                      const row = document.createElement("tr");
                      TotalLpo = lpo.length;//total purchaseorders count
                      // 2. 💡 CRITICAL FIX: Set your data markers directly onto the element object wrapper!
                      row.setAttribute('data-id', lpo.ID || "");
                      row.setAttribute('data-lpono', lpo.LPONumber || "");
                      let badgeClass = "text-danger";
                      let rowTextColorStyle = ""; // 🎯 Holder for row inline color styles
                      // 2. 🎨 MAP ROW TEXT COLOR DIRECTLY TO FINANCIAL REGISTRY STATUSES
                      // const lpoTypeValues = (lpo.LPOType || "LPO").toUpperCase();

                      // if (lpoTypeValues === "LPO") {
                      //   //badgeClass = "bg-success";
                      //   rowTextColorStyle = "color: blue;"; // green
                      // } else if (lpoTypeValues === "LPO (Revised)" || lpoTypeValues === "LPO (REVISED)") {
                      //   //badgeClass = "bg-warning text-dark";
                      //   rowTextColorStyle = "color: red;"; // red
                      // } else if (lpoTypeValues === "LPO (Final)" || lpoTypeValues === "LPO (FINAL)") {
                      //   badgeClass = "bg-info text-dark";
                      //   rowTextColorStyle = "color: green;"; // purple
                      //  } 
                      //else if (
                      //   quoteTypeValues === "ADV.PAID" ||
                      //   quoteTypeValues === "ADVANCE PAID"
                      // ) {
                      //   badgeClass = "bg-danger";
                      //   rowTextColorStyle = "color: blue;"; //  blue text row
                      // }
                      // 3. Inject the style attribute directly into the opening <tr> element node
                      // if (rowTextColorStyle) {
                      //   row.setAttribute("style", rowTextColorStyle);
                      // }
                      
                      row.innerHTML = `
                        
                        <td class="col-width-id">${lpo.ID || "N/A"}</td> <!-- 🎯 ADDED CLASS HERE TO HIDE CELL -->
                        <td class="col-width-sd" style="text-align: center;">${lpo.LPONumber || "N/A"}</td>
                        <td class="col-width-md" style="text-align: center;">${formatToDdMMMyyyy(lpo.LPODate)}</td>
                        <td class="col-width-customer">${lpo.Customer || "CASH"}</td>
                        <td class="col-width-sm" style="text-align: center;">${lpo.Emirate || "ABU DHABI"}</td>
                        <td class="col-width-md" style="text-align: right;">${parseFloat(lpo.SubTotal || 0).toFixed(2)}</td>
                        <td class="col-width-md" style="text-align: right;">${parseFloat(lpo.VatTotal || 0).toFixed(2)}</td>
                        <td class="col-width-md" style="text-align: right;">${parseFloat(lpo.GrandTotal || 0).toFixed(2)}</td>
                        <td class="col-width-md" style="text-align: center;">${lpo.Validity || "7 Days"}</td>
                        <td class="col-width-sm" style="text-align: center;">${lpo.User_name || "-"}</td>
                        
                    `;
                      lpotbody.appendChild(row);
                    });
                    
                  })
                  .catch((err) => {
                    console.error("Critical rendering pipeline issue:", err);
                    lpoloadingOverlay.style.display = "none";
                    lpotableBlock.style.opacity = "1.0";
                    lpotbody.innerHTML =
                      '<tr><td colspan="13" class="text-center text-danger py-3">Error streaming dataset values. Check server connection metrics.</td></tr>';
                  });
                  
              }
              // 🎯 GLOBAL STORAGE TRACKER FOR THE ACTIVE SELECTED CREDIT NOTE DATA
              let activeSelectedLPONo = null;
              let activeSelectedLPOId = null;
              
//#endregion

//#region  BUTTON LPO RESET CLICK EVENT
              document.getElementById("btn-lpo-reset").addEventListener("click", () => 
                {
                  // document.getElementById("search-lpo-no").value = "";
                  document.getElementById("search-lpo-customer").value = "";
                  // document.getElementById("filter-lpo-status").value = "ALL";
                  document.getElementById("filter-lpo-range").value = "3MONTH";
                  document.getElementById("filter-lpo-start-date").value = "";
                  document.getElementById("filter-lpo-end-date").value = "";
                  fetchFilteredLPO();
                });
//#endregion ============ END BUTTON RESET CLICK EVENT ===================================//

//#region  OPEN LPO DYNAMIC CONTEXT MENU
              document.getElementById("lpo-rows").addEventListener("contextmenu", function (e) {
                  const clickedRow = e.target.closest("tr");
                  if (!clickedRow) return;
                  e.preventDefault();
                  activeSelectedLPOId = clickedRow.getAttribute("data-id") || "";
                  activeSelectedLPONo = clickedRow.getAttribute("data-lpo") || "";
                  activeSelectedLPONo = activeSelectedLPONo.replace(/<[^>]*>/g, "").trim();

                const oldHighlightedRow = document.querySelector("#lpo-rows tr.lpo-rows-highlight-context");
                if (oldHighlightedRow) {
                  oldHighlightedRow.classList.remove("lpo-rows-highlight-context");
                }
                clickedRow.classList.add("lpo-rows-highlight-context");

                const menuElement = document.getElementById("lpo-context-menu");
                menuElement.style.visibility = "hidden"; // Render invisibly first so it takes shape in the DOM
                menuElement.style.display = "block";

                const menuWidth = menuElement.offsetWidth || 150;
                const menuHeight = menuElement.offsetHeight || 120;
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;

                let targetX = e.clientX;
                if (e.clientX + menuWidth > windowWidth) {
                  targetX = windowWidth - menuWidth - 10; // 10px safety margin from window edge
                }
                
                let targetY = e.clientY;
                if (e.clientY + menuHeight > windowHeight) {
                  targetY = e.clientY - menuHeight; // Shifts the menu completely above your cursor
                  
                  if (targetY < 0) targetY = 10; 
                }
                
                menuElement.style.left = targetX + "px";
                menuElement.style.top = targetY + "px";
                menuElement.style.visibility = "visible"; 
                e.stopPropagation();
                });

              document.addEventListener("click", function (e) {
                const menuElement = document.getElementById(
                  "lpo-context-menu",
                );
                if (!e.target.closest("#lpo-context-menu")) {
                  menuElement.style.display = "none";
                  document
                    .querySelectorAll("#lpo-rows tr")
                    .forEach((row) =>
                      row.classList.remove("lpo-rows-highlight-context"),
                    );
                }
              });
//#endregion

//#region  FORMAT DATE TO DISPLAY DD-MMM-YYYY
              function formatToDdMMMyyyy(dateString) {
                if (!dateString) return "N/A";
                const dateObj = new Date(dateString);
                if (isNaN(dateObj.getTime())) return "N/A";
                const day = String(dateObj.getDate()).padStart(2, "0");
                const yy = String(dateObj.getFullYear()).slice(-2);
                const months = [
                  "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",
                ];
                return (
                  day + "-" + months[dateObj.getMonth()] + "-" + yy
                );
              }
//#endregion ============ END FORMAT DATE TO DISPLAY DD-MMM-YYYY===================================//

}

//#endregion 
//==========================================================================================//    

//============================CUSTOMER ORDERS==============================================//
//#region 📌 CUSTOMER ORDERS CODE ALL INSERT HERE
function initCOPage() {
  let TotalCo = "";

//#region  LOAD CO FROM DATABASE
              const btncoSearch = document.getElementById("btn-co-search");
              if (!btncoSearch) return;               
              fetchFilteredCO();
//#endregion

//#region  CO SEARCH BUTTON CLICK EVENT
             btncoSearch.addEventListener("click", fetchFilteredCO);

              //================ SEARCH EVENTS FOR RANGE, STATUS, QUOTATION NUMBER, CUSTOMER NAME ====================//
              document.getElementById("filter-co-range").addEventListener("change", (event) => 
                {
                    document.getElementById("filter-co-start-date").value = "";
                    document.getElementById("filter-co-end-date").value = "";
                    fetchFilteredCO();
                });
              document.getElementById("filter-co-status").addEventListener("change", (event) => 
                {
                  
                  fetchFilteredCO();
                });
              // document.getElementById("search-co-no").addEventListener("input", () => 
              //   {
                  
              //     fetchFilteredCO();
              //   });
              document.getElementById("search-co-customer").addEventListener("input", () => 
                {
                  
                  fetchFilteredCO();
                });
//#endregion

//#region  FETCH CO FROM DATABASE FUNCTION
              
              function fetchFilteredCO() {
                document.getElementById("co-head").textContent = `CO Registry`;
                const coloadingOverlay = document.getElementById("co-loading-overlay");
                const cotableBlock = document.getElementById("co-table-display-block");
                const cotbody = document.getElementById("co-rows");
                
                coloadingOverlay.style.display = "block";
                cotableBlock.style.opacity = "0.4";

                const payload = {
                  // CONo: document.getElementById("search-co-no").value.trim(),
                  searchQuery: document.getElementById("search-co-customer").value.trim(),
                  Status: document.getElementById("filter-co-status").value,
                  timeRange: document.getElementById("filter-co-range").value,
                  startDate: document.getElementById("filter-co-start-date").value,
                  endDate: document.getElementById("filter-co-end-date").value,
                };
                //console.log("[ERP DEBUG] Credit Notes Data Retrieved:", payload);

                fetch("/api/customerorders", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                  
                })
                
                  .then((res) => res.json())
                  .then((data) => { 
                    // console.log("[ERP DEBUG] Credit Notes Data Retrieved:", data.customerorders);
                    cotbody.innerHTML = "";
                    coloadingOverlay.style.display = "none";
                    cotableBlock.style.opacity = "1.0";
                    
                    //TotalQuote = data.purchaseorders.length;//total purchaseorders count
                    if (
                      !data.success || !data.customerorders || data.customerorders.length === 0) {
                      
                      cotbody.innerHTML =
                        '<tr><td colspan="13" class="text-center text-muted py-3">No matching Customerorders records found inside database registry.</td></tr>';
                      return;
                      
                    }
                    TotalCo = "";
                    TotalCo = data.customerorders.length;//total quotations count
                                       // 1. Extract all dates and convert them to timestamps
                    const timestamps = data.customerorders.map(customerorder => new Date(customerorder.CODate).getTime());
                    // 2. Find the minimum and maximum timestamps
                    const minTimestamp = Math.min(...timestamps);
                    const maxTimestamp = Math.max(...timestamps);                    
                    document.getElementById("co-head").innerHTML = `Customer Orders (${TotalCo})`;
                    const now = new Date();
                    document.getElementById("co-head-date").innerHTML = formatToDdMMMyyyy(now);
                    // 💡 DYNAMICALLY UPDATE THE DATE PICKERS FOR DELIVERY ORDERS
                    if (data.computedDates.from) {
                        document.getElementById("filter-co-start-date").value = data.computedDates.from;
                    } else {
                        document.getElementById("filter-co-start-date").value = ""; // Clear if FULL history selection
                    }

                    if (data.computedDates.to) {
                        document.getElementById("filter-co-end-date").value = data.computedDates.to;
                    } else {
                        document.getElementById("filter-co-end-date").value = ""; // Clear if FULL history selection
                    }

                    data.customerorders.forEach((co) => {
                      const row = document.createElement("tr");
                      TotalCo = co.length;//total purchaseorders count
                      // 2. 💡 CRITICAL FIX: Set your data markers directly onto the element object wrapper!
                      row.setAttribute('data-id', co.ID || "");
                      row.setAttribute('data-cono', co.CONo || "");
                      row.setAttribute('data-customer', co.Customer || '');
                      row.dataset.status=String(co.Status||'Pending').trim().toUpperCase();
                      let badgeClass = "text-danger";
                      let rowTextColorStyle = ""; // 🎯 Holder for row inline color styles
                      // 2. 🎨 MAP ROW TEXT COLOR DIRECTLY TO FINANCIAL REGISTRY STATUSES
                      const coStatusValues = (co.Status || "Pending").toUpperCase();

                      if (coStatusValues === "Delivered" || coStatusValues === "DELIVERED") {
                        //badgeClass = "bg-success";
                        rowTextColorStyle = "color: green;"; // green
                      } else if (coStatusValues === "Pending" || coStatusValues === "PENDING") {
                        //badgeClass = "bg-warning text-dark";
                        rowTextColorStyle = "color: red;"; // red
                      } else if (coStatusValues === "Partial" || coStatusValues === "PARTIAL") {
                        //badgeClass = "bg-info text-dark";
                        rowTextColorStyle = "color: blue;"; // purple
                       } 
                      //else if (
                      //   quoteTypeValues === "ADV.PAID" ||
                      //   quoteTypeValues === "ADVANCE PAID"
                      // ) {
                      //   badgeClass = "bg-danger";
                      //   rowTextColorStyle = "color: blue;"; //  blue text row
                      // }
                      //3. Inject the style attribute directly into the opening <tr> element node
                      if (rowTextColorStyle) {
                        row.setAttribute("style", rowTextColorStyle);
                      }
                      
                      row.innerHTML = `
                        
                        <td class="col-width-id">${co.ID || "N/A"}</td> <!-- 🎯 ADDED CLASS HERE TO HIDE CELL -->
                        <td>${co.CONo || "N/A"}</td>
                        <td>${formatToDdMMMyyyy(co.CODate)}</td>
                        <td>${co.LPONo || "-"}</td>
                        <td>${co.Customer || "CASH"}</td>
                        <td>${co.Emirate || "ABU DHABI"}</td>
                        <td style="text-align: right;">${parseFloat(co.GrandTotal || 0).toFixed(2)}</td>
                        <td style="text-align: right;">${parseFloat(co.DeliveredTotal || 0).toFixed(2)}</td>
                        <td style="text-align: right;">${parseFloat(co.PendingTotal || 0).toFixed(2)}</td>
                        <td>${co.Status || "Pending"}</td>
                        <td>${co.PaymentTerms || "IMMEDIATE"}</td>
                        <td>${formatToDdMMMyyyy(co.DeliveryDate) ||""}</td>
                        <td>${co.User_name || "-"}</td>
                        
                    `;
                      cotbody.appendChild(row);
                    });
                    
                  })
                  .catch((err) => {
                    console.error("Critical rendering pipeline issue:", err);
                    coloadingOverlay.style.display = "none";
                    cotableBlock.style.opacity = "1.0";
                    cotbody.innerHTML =
                      '<tr><td colspan="13" class="text-center text-danger py-3">Error streaming dataset values. Check server connection metrics.</td></tr>';
                  });
                  
              }
              // 🎯 GLOBAL STORAGE TRACKER FOR THE ACTIVE SELECTED CREDIT NOTE DATA
              let activeSelectedCONo = null;
              let activeSelectedCOId = null;
              let activeSelectedCOCustomer = "";
              let activeSelectedCOStatus = "";
              
//#endregion

//#region  BUTTON CO RESET CLICK EVENT
              document.getElementById("btn-co-reset").addEventListener("click", () => 
                {
                  // document.getElementById("search-co-no").value = "";
                  document.getElementById("search-co-customer").value = "";
                  document.getElementById("filter-co-status").value = "ALL";
                  document.getElementById("filter-co-range").value = "3MONTH";
                  document.getElementById("filter-co-start-date").value = "";
                  document.getElementById("filter-co-end-date").value = "";
                  fetchFilteredCO();
                });
//#endregion ============ END BUTTON RESET CLICK EVENT ===================================//

//#region  OPEN CO DYNAMIC CONTEXT MENU
              document.getElementById("co-rows").addEventListener("contextmenu", function (e) {
                  const clickedRow = e.target.closest("tr");
                  if (!clickedRow) return;
                  e.preventDefault();
                  activeSelectedCOId = clickedRow.getAttribute("data-id") || "";
                  activeSelectedCOCustomer=clickedRow.getAttribute("data-customer") || "";
                  activeSelectedCOStatus=String(clickedRow.dataset.status||'').trim().toUpperCase();
                  const createInvoiceAction=document.querySelector('#co-context-menu [data-action="CREATE INVOICE"]');
                  if(createInvoiceAction){const disabled=activeSelectedCOStatus==='DELIVERED';createInvoiceAction.setAttribute('aria-disabled',String(disabled));createInvoiceAction.style.opacity=disabled?'0.4':'1';createInvoiceAction.style.cursor=disabled?'not-allowed':'pointer';createInvoiceAction.title=disabled?'This Customer Order is fully delivered.':'Create an invoice for pending quantities.';}

                  activeSelectedCONo = clickedRow.getAttribute("data-cono") || clickedRow.getAttribute("data-co") || clickedRow.cells[1]?.textContent || "";
                  activeSelectedCONo = activeSelectedCONo.replace(/<[^>]*>/g, "").trim();

                const oldHighlightedRow = document.querySelector("#co-rows tr.co-rows-highlight-context");
                if (oldHighlightedRow) {
                  oldHighlightedRow.classList.remove("co-rows-highlight-context");
                }
                clickedRow.classList.add("co-rows-highlight-context");

                const menuElement = document.getElementById("co-context-menu");
                menuElement.style.visibility = "hidden"; // Render invisibly first so it takes shape in the DOM
                menuElement.style.display = "block";

                const menuWidth = menuElement.offsetWidth || 150;
                const menuHeight = menuElement.offsetHeight || 120;
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;

                let targetX = e.clientX;
                if (e.clientX + menuWidth > windowWidth) {
                  targetX = windowWidth - menuWidth - 10; // 10px safety margin from window edge
                }
                
                let targetY = e.clientY;
                if (e.clientY + menuHeight > windowHeight) {
                  targetY = e.clientY - menuHeight; // Shifts the menu completely above your cursor
                  
                  if (targetY < 0) targetY = 10; 
                }
                
                menuElement.style.left = targetX + "px";
                menuElement.style.top = targetY + "px";
                menuElement.style.visibility = "visible"; 
                e.stopPropagation();
                });

              document.addEventListener("click", function (e) {
                const menuElement = document.getElementById(
                  "co-context-menu",
                );
                if (!e.target.closest("#co-context-menu")) {
                  menuElement.style.display = "none";
                  document
                    .querySelectorAll("#co-rows tr")
                    .forEach((row) =>
                      row.classList.remove("co-rows-highlight-context"),
                    );
                }
              });
//#endregion

//#region  FORMAT DATE TO DISPLAY DD-MMM-YYYY
              function formatToDdMMMyyyy(dateString) {
                if (!dateString) return "N/A";
                const dateObj = new Date(dateString);
                if (isNaN(dateObj.getTime())) return "N/A";
                const day = String(dateObj.getDate()).padStart(2, "0");
                const yy = String(dateObj.getFullYear()).slice(-2);
                const months = [
                  "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",
                ];
                return (
                  day + "-" + months[dateObj.getMonth()] + "-" + yy
                );
              }
//#endregion ============ END FORMAT DATE TO DISPLAY DD-MMM-YYYY===================================//

// New Customer Order dates, delivery quantities, status and item editor.
(function(){
 function initializeEditCO(){
  const modal=document.getElementById('editco-modal-overlay'),form=document.getElementById('editco-invoice-master-form');
  if(!modal||!form)return;
  const body=document.getElementById('editco-modal-items-rows'),add=document.getElementById('editco-btn-add');
  const field=n=>document.getElementById('editco-'+n),value=n=>field(n).value.trim(),num=n=>Number(value(n))||0,round=n=>Math.round((n+Number.EPSILON)*100)/100,money=n=>(Number(n)||0).toFixed(2);
  let lines=[],editing=-1;
  function colour(){const status=value('status').toLowerCase();field('status').style.backgroundColor=status==='pending'?'#dc3545':status==='partial'?'#0d6efd':'#198754';field('status').style.color='white';}
  field('status').addEventListener('input',colour);field('status').addEventListener('change',colour);
  function calculate(line){
   const net=line.price*(1-line.discount/100);line.pending=line.qty-line.delivered;
   line.tax=round(net*line.qty);line.vatTotal=round(line.tax*line.vat/100);line.total=round(line.tax+line.vatTotal);
   line.deliveredTax=round(net*line.delivered);line.deliveredVat=round(line.deliveredTax*line.vat/100);line.deliveredTotal=round(line.deliveredTax+line.deliveredVat);
   line.pendingTax=round(line.tax-line.deliveredTax);line.pendingVat=round(line.vatTotal-line.deliveredVat);line.pendingTotal=round(line.total-line.deliveredTotal);
   line.unitCost=round(line.cost*line.qty);line.margin=round(line.tax-line.unitCost);line.stock=line.openStock; // Stock is informational; no deduction or product update.
   line.stockValue=round(line.stock*line.cost);
   line.status=line.delivered===0?'Pending':line.pending===0?'Delivered':'Partial';return line;
  }
  function valid(line){return !line.item||!line.pid?'Please select a product.':!Number.isSafeInteger(line.qty)||line.qty<=0?'Order Qty must be a positive whole number.':!Number.isSafeInteger(line.delivered)||line.delivered<0||line.delivered>line.qty?'Deliver Qty must be between 0 and Order Qty.':!Number.isFinite(line.price)||line.price<=0||!Number.isFinite(line.discount)||line.discount<0||line.discount>100||!Number.isFinite(line.vat)||line.vat<0?'Please check price, discount and VAT.':'';}
  function editor(){const line=calculate({item:value('products'),pid:value('pid'),qty:num('order-qty'),delivered:num('deliver-qty'),price:num('unit-price'),discount:num('disc-per'),vat:num('vat-per'),size:value('i-size'),ral:value('i-ral'),unit:value('i-unit'),cost:num('i-cost'),openStock:num('o-stock')});field('pending-qty').value=line.pending;for(const[name,val]of Object.entries({'taxable':line.tax,'vat-total':line.vatTotal,'unit-total':line.total,'disc-amt':line.price*line.discount/100,'u-cost':line.unitCost,'u-margin':line.margin,'s-value':line.stockValue}))field(name).value=money(val);field('a-stock').value=line.stock;field('a-stock').style.backgroundColor=line.stock===0?'#dc3545':'#198754';field('a-stock').style.color='#ffffff';return line;}
  window.calculateDynamicEditCOTotal=editor;
  function syncOrderQuantity(){
   field('deliver-qty').value=Math.min(Math.max(0,num('deliver-qty')),Math.max(0,num('order-qty')));
   field('deliver-qty').max=Math.max(0,num('order-qty'));
   editor();
  }
  function syncDeliveryQuantity(){
   const order=Math.max(0,num('order-qty')),entered=Number(field('deliver-qty').value);
   if(Number.isFinite(entered)&&field('deliver-qty').value!=='')field('deliver-qty').value=Math.min(order,Math.max(0,entered));
   editor();
  }
  for(const event of ['input','change']){
   field('order-qty').addEventListener(event,syncOrderQuantity);
   field('deliver-qty').addEventListener(event,syncDeliveryQuantity);
  }
  field('order-qty').step='1';field('deliver-qty').type='number';field('deliver-qty').min='0';field('deliver-qty').step='1';
  for(const name of ['unit-price','disc-per','vat-per','i-cost','o-stock'])field(name).addEventListener('input',editor);
  field('pending-qty').readOnly=true;
  function totals(){
   const sum=k=>round(lines.reduce((n,line)=>n+line[k],0));
   for(const[name,key]of Object.entries({'taxable-value':'tax','total-vat':'vatTotal','grand-total':'total','pending-taxable-value':'pendingTax','pending-total-vat':'pendingVat','pending-grand-total':'pendingTotal','delivered-taxable-value':'deliveredTax','delivered-total-vat':'deliveredVat','delivered-grand-total':'deliveredTotal','t-cost':'unitCost','t-margin':'margin'}))field(name).value=money(sum(key));
   field('amount-in-words').value=toWordsConfig.convert(sum('total'));
   field('status').value=lines.every(line=>line.status==='Delivered')?'Delivered':lines.every(line=>line.status==='Pending')?'Pending':'Partial';colour();
  }
  const rowMenu=document.createElement('div');rowMenu.id='editco-items-context-menu';rowMenu.style.display='none';rowMenu.setAttribute('role','menu');
  for(const [action,label]of [['EDIT','Edit this Item'],['DELETE','Delete this Item']]){const button=document.createElement('button');button.type='button';button.dataset.action=action;button.textContent=label;button.setAttribute('role','menuitem');rowMenu.appendChild(button);}document.body.appendChild(rowMenu);
  let menuRow=-1,holdTimer=null;
  function hideRowMenu(){rowMenu.style.display='none';}
  function showRowMenu(index,x,y){if(!lines[index])return;menuRow=index;rowMenu.style.display='block';rowMenu.style.left=Math.max(6,Math.min(x,innerWidth-rowMenu.offsetWidth-6))+'px';rowMenu.style.top=Math.max(6,Math.min(y,innerHeight-rowMenu.offsetHeight-6))+'px';}
  rowMenu.addEventListener('click',event=>{const action=event.target.closest('[data-action]')?.dataset.action;hideRowMenu();if(!lines[menuRow])return;if(action==='EDIT')openItem(menuRow);else if(action==='DELETE'&&confirm('Delete this Customer Order item?')){lines.splice(menuRow,1);menuRow=-1;closeItem();render();totals();}});
  document.addEventListener('pointerdown',event=>{if(!event.target.closest('#editco-items-context-menu'))hideRowMenu();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')hideRowMenu();});
  window.addEventListener('resize',hideRowMenu);

  function render(){body.replaceChildren();lines.forEach((line,index)=>{
   const row=document.createElement('tr'),values=[index+1,line.item,line.qty,line.delivered,line.pending,line.size,line.ral,line.unit,money(line.price),line.discount,line.vat,money(line.tax),money(line.vatTotal),money(line.deliveredTax),money(line.total),line.pid,line.stock,money(line.cost),money(line.unitCost),money(line.stockValue),money(line.margin),line.status];
   row.dataset.itemId=line.id??'';row.dataset.pid=line.pid;row.dataset.status=line.status;row.classList.add('co-row-'+line.status.toLowerCase());
   values.forEach((val,column)=>{const cell=document.createElement('td');cell.textContent=val??'';if(column===3){cell.textContent='';const input=document.createElement('input');input.type='number';input.min='0';input.max=line.qty;input.step='1';input.value=line.delivered;input.className='form-control form-control-sm';input.setAttribute('aria-label','Deliver Qty for row '+(index+1));input.addEventListener('input',()=>{const amount=Number(input.value);if(input.value.trim()===''||!Number.isSafeInteger(amount))return;if(amount<0||amount>line.qty){input.value=line.delivered;alert('Deliver Qty must be between 0 and Order Qty.');return;}line.delivered=amount;calculate(line);row.classList.remove('co-row-delivered','co-row-pending','co-row-partial');row.classList.add('co-row-'+line.status.toLowerCase());row.dataset.status=line.status;for(const[col,val]of [[4,line.pending],[13,money(line.deliveredTax)],[16,line.stock],[19,money(line.stockValue)],[21,line.status]])row.cells[col].textContent=val;totals();});
            input.addEventListener('change',()=>{const quantity=Number(input.value);if(input.value.trim()===''||!Number.isSafeInteger(quantity)||quantity<0||quantity>line.qty){alert('Deliver Qty cannot be negative or exceed Order Qty.');input.value=line.delivered;return;}line.delivered=quantity;calculate(line);render();totals();});cell.appendChild(input);}row.appendChild(cell);});
   row.addEventListener('dblclick',event=>{if(!event.target.closest('input,button')){event.stopPropagation();openItem(index);}});row.addEventListener('contextmenu',event=>{event.preventDefault();event.stopPropagation();clearTimeout(holdTimer);showRowMenu(index,event.clientX,event.clientY);});
   let pressStart;
   row.addEventListener('pointerdown',event=>{if(event.pointerType==='mouse'||event.target.closest('input,button'))return;pressStart={x:event.clientX,y:event.clientY};clearTimeout(holdTimer);holdTimer=setTimeout(()=>showRowMenu(index,event.clientX,event.clientY),550);});
   row.addEventListener('pointermove',event=>{if(pressStart&&Math.hypot(event.clientX-pressStart.x,event.clientY-pressStart.y)>10)clearTimeout(holdTimer);});
   for(const type of ['pointerup','pointercancel'])row.addEventListener(type,()=>clearTimeout(holdTimer));
   body.appendChild(row);
  });}
  add.addEventListener('click',()=>{const line=editor(),error=valid(line);if(error)return alert(error);if(lines.some(old=>old.pid===line.pid))return alert('This product is already in the order.');lines.push(line);render();totals();for(const[name,val]of Object.entries({products:'','item-code':'',pid:'','order-qty':0,'deliver-qty':0,'unit-price':0,'disc-per':0,'vat-per':5,'i-cost':0,'o-stock':0}))field(name).value=val;editor();});
  const itemModal=document.getElementById('editcoitems-modal-overlay'),itemField=n=>document.getElementById('editcoitems-'+n);
  function closeItem(){itemModal.style.display='none';editing=-1;}
  function itemDraft(){if(editing<0)return null;const line=calculate({...lines[editing],qty:Number(itemField('qty').value),delivered:Number(itemField('delivery-qty').value),price:Number(itemField('unit-price').value),discount:Number(itemField('disc-per').value),vat:Number(itemField('vat-per').value),size:itemField('i-size').value,ral:itemField('i-ral').value,unit:itemField('i-unit').value});for(const[name,val]of Object.entries({'taxable':line.tax,'vat-total':line.vatTotal,'unit-total':line.total,'disc-amt':line.price*line.discount/100,'u-cost':line.unitCost,'u-margin':line.margin,'s-value':line.stockValue}))itemField(name).value=money(val);itemField('a-stock').value=line.stock;itemField('a-stock').style.backgroundColor=line.stock===0?'#dc3545':'#198754';itemField('a-stock').style.color='#ffffff';itemField('delivery-qty').max=line.qty;return line;}
  function openItem(index){editing=index;const line=lines[index];document.getElementById('editcoitems-title-text').textContent='Edit Row - Sr No- '+(index+1);for(const[name,key]of Object.entries({product:'item',pid:'pid',qty:'qty','delivery-qty':'delivered','unit-price':'price','disc-per':'discount','vat-per':'vat','i-size':'size','i-ral':'ral','i-unit':'unit','i-cost':'cost','o-stock':'openStock'}))itemField(name).value=line[key];itemField('sr-number').value=index+1;itemDraft();document.getElementById('editcoitems-transaction-form').classList.toggle('show-secret',form.classList.contains('show-secret'));itemModal.style.display='flex';}
  itemField('qty').addEventListener('input',()=>{itemField('delivery-qty').value=Math.min(Number(itemField('delivery-qty').value)||0,Number(itemField('qty').value)||0);itemDraft();});
  itemField('delivery-qty').addEventListener('input',()=>{const order=Math.max(0,Number(itemField('qty').value)||0),amount=Number(itemField('delivery-qty').value);if(Number.isFinite(amount))itemField('delivery-qty').value=Math.min(order,Math.max(0,amount));itemDraft();});
  for(const name of ['unit-price','disc-per','vat-per'])itemField(name).addEventListener('input',itemDraft);
  itemModal.querySelectorAll('.btn-cancel').forEach(button=>button.addEventListener('click',closeItem));
  document.getElementById('editcoitems-update-button').addEventListener('click',()=>{const line=itemDraft();if(!line)return;const error=valid(line);if(error)return alert(error);lines[editing]=line;closeItem();render();totals();});

  const updateButton=document.getElementById('btn-save-editco');
  updateButton.textContent='Update';let updatingCO=false;
  updateButton.addEventListener('click',async()=>{
   if(updatingCO)return;
   for(const[name,label]of [['customer','Customer'],['emirate','Emirate'],['address','Address'],['invoice-date','CO Date']]){
    if(!value(name)){const section=field(name).closest('.co-edit-section');section?.classList.remove('is-closed');section?.previousElementSibling?.setAttribute('aria-expanded','true');alert(label+' is required.');field(name).focus();return;}
   }
   if(!lines.length)return alert('Please add at least one Customer Order item.');
   for(const line of lines){const error=valid(line);if(error)return alert(error);}
   totals();
   const mapping={Customer:'customer',PostBox:'postbox',Emirate:'emirate',Address:'address',VatID:'vat-no',LPONo:'lpo-no',PaymentTerms:'payment-terms',CustContact:'contact-person',CustConNumber:'contact-number',ProjectName:'project-name',Description:'notes',CODate:'invoice-date',DeliveryDate:'deliver-date',InWords:'amount-in-words'};
   const main=Object.fromEntries(Object.entries(mapping).map(([key,name])=>[key,value(name)]));
   main.CONo=modal.dataset.coNo;
   // Preserve optional contact fields unless controls are present in this layout.
   for(const[key,name]of [['OurContact','our-contact'],['OurNumber','our-number']])if(field(name))main[key]=field(name).value;
   const items=lines.map((line,index)=>({ID:line.id||undefined,SrNo:index+1,Item:line.item,PID:line.pid,Quantity:line.qty,DQuantity:line.delivered,UnitPrice:line.price,Discount:line.discount,VatPer:line.vat,IUnit:line.unit,IRAL:line.ral,ISize:line.size}));
   updatingCO=true;updateButton.disabled=true;updateButton.setAttribute('aria-busy','true');updateButton.innerHTML='<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Updating…';
   const cancelButtons=[...modal.querySelectorAll('.btn-cancel')];cancelButtons.forEach(button=>button.disabled=true);
   try{
    const response=await fetch('/api/update-co',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({main,items})});
    const data=await response.json();if(!response.ok||!data.success)throw Error(data.error||data.message||'Customer Order update failed.');
    closeItem();hideRowMenu();modal.style.display='none';window.parent?.lockSidebarAndRefresh?.(false);
    fetchFilteredCO();alert(data.message||'Customer Order updated successfully.');
   }catch(error){alert(error.message);}
   finally{updatingCO=false;updateButton.disabled=false;updateButton.removeAttribute('aria-busy');updateButton.textContent='Update';cancelButtons.forEach(button=>button.disabled=false);}
  });

  // Edit CO restricted fields: match the other modal reveal and inactivity timer.
  const secretTable=document.getElementById('editco-invoice-table'),secretItemForm=document.getElementById('editcoitems-transaction-form'),secretCountdown=document.getElementById('editco-countdown-seconds');
  let coSecretTimer=null,coSecretRemaining=30;
  function lockEditCOSecrets(){
   form.classList.remove('show-secret');secretTable.classList.remove('show-secret');secretItemForm?.classList.remove('show-secret');
   if(coSecretTimer!==null)clearInterval(coSecretTimer);coSecretTimer=null;if(secretCountdown)secretCountdown.style.display='none';
  }
  function refreshEditCOSecretTimer(){
   if(coSecretTimer!==null)clearInterval(coSecretTimer);coSecretRemaining=30;
   if(secretCountdown){secretCountdown.textContent=String(coSecretRemaining);secretCountdown.style.display='inline-block';}
   coSecretTimer=setInterval(()=>{coSecretRemaining--;if(secretCountdown)secretCountdown.textContent=String(coSecretRemaining);if(coSecretRemaining<=0)lockEditCOSecrets();},1000);
  }
  form.addEventListener('dblclick',event=>{
   if(event.target.closest('input,button,select,textarea,a,table'))return;
   if(form.classList.contains('show-secret'))return lockEditCOSecrets();
   const password=prompt('Enter manager password to view restricted columns:');
   if(password==='admin123'){form.classList.add('show-secret');secretTable.classList.add('show-secret');refreshEditCOSecretTimer();}
   else if(password!==null)alert('Incorrect password. Access denied.');
  });
  for(const region of [form,secretItemForm])if(region)for(const activity of ['mousemove','keypress','input','pointerdown'])region.addEventListener(activity,()=>{if(form.classList.contains('show-secret'))refreshEditCOSecretTimer();});
  new MutationObserver(()=>{if(modal.style.display==='none')lockEditCOSecrets();}).observe(modal,{attributes:true,attributeFilter:['style']});

  window.loadEditCustomerOrder=function(master,items){
   lockEditCOSecrets();form.reset();
   const mapping={Customer:'customer',PostBox:'postbox',Emirate:'emirate',Address:'address',VatID:'vat-no',LPONo:'lpo-no',PaymentTerms:'payment-terms',CustContact:'contact-person',CustConNumber:'contact-number',ProjectName:'project-name',Description:'notes'};
   Object.entries(mapping).forEach(([key,name])=>field(name).value=master[key]??'');
   field('invoice-date').value=String(master.CODate??'').split('T')[0];field('deliver-date').value=String(master.DeliveryDate??'').split('T')[0];
   field('number').value=master.CONo;modal.dataset.coNo=String(master.CONo);
   lines=items.map(item=>calculate({id:item.ID??item._id??'',item:item.Item??'',pid:String(item.PID??''),qty:Number(item.Quantity)||0,
    delivered:Number(item.DQuantity??(Number(item.Quantity)-Number(item.PQuantity??item.Quantity)))||0,
    price:Number(item.UnitPrice)||0,discount:Number(item.Discount)||0,vat:Number(item.VatPer)||0,
    size:item.ISize??'-',ral:item.IRAL??'-',unit:item.IUnit??'-',cost:Number(item.LiveCost??item.Icost)||0,openStock:Number(item.LiveStockCount??item.Stock)||0}));
   field('order-qty').value=0;field('deliver-qty').value=0;field('pending-qty').value=0;editor();render();totals();
   document.getElementById('editco-modal-title').textContent='EDIT CUSTOMER ORDER - '+master.CONo;
   form.querySelectorAll('.co-edit-section').forEach(section=>{section.classList.add('is-closed');section.previousElementSibling?.setAttribute('aria-expanded','false');});
  };
  // Mobile sections are collapsed by default; desktop field order remains intact.
  const rows=Array.from(form.children).filter(node=>node.tagName==='DIV');
  const titles=['Customer Details','Order Details','Item Details','Amounts, Notes & Costs','Stock & Totals','Status & Amount in Words'];
  rows.filter(row=>!row.querySelector('#editco-invoice-table')).forEach((row,index)=>{
   row.classList.add('co-edit-section','is-closed');const button=document.createElement('button');button.type='button';button.className='co-edit-toggle';button.textContent=titles[index]||'Details';button.setAttribute('aria-expanded','false');button.addEventListener('click',()=>{const open=!row.classList.toggle('is-closed');button.setAttribute('aria-expanded',String(open));});row.before(button);
  });
  rows.find(row=>row.querySelector('#editco-invoice-table'))?.classList.add('co-edit-table-section');
  form.addEventListener('invalid',event=>{const row=event.target.closest('.co-edit-section');if(row){row.classList.remove('is-closed');row.previousElementSibling?.setAttribute('aria-expanded','true');}},true);
  editor();colour();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initializeEditCO);else initializeEditCO();
})();


 //#region CREATE INVOICE FROM SELECTED CUSTOMER ORDER
  const coInvoiceModal = document.getElementById('co-newinvo-modal-overlay');
  if (coInvoiceModal) {
    const form = document.getElementById('co-newinvo-invoice-master-form');
    const table = document.getElementById('co-newinv-invoice-table');
    const body = document.getElementById('co-newinvo-modal-items-rows');
    const save = document.getElementById('btn-save-co-newinvoice');
    const add = document.getElementById('co-newinv-btn-add');
    const field = name => document.getElementById('co-newinv-' + name);
    const value = name => field(name)?.value.trim() ?? '';
    const number = name => Number(value(name)) || 0;
    const round = n => Math.round((n + Number.EPSILON) * 100) / 100;
    const money = n => (Number(n) || 0).toFixed(2);
    const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
    let lines = [], editing = -1, busy = false, loading = false, sourceRequestId='';
    const lockRefresh = event => { if (event.key === 'F5' || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'r')) event.preventDefault(); };
    function closeCOInvoice() {
      if (busy) return;
      closeItemEditor();hideItemMenu();lockCOInvoiceSecrets();
      coInvoiceModal.style.display = 'none';
      window.removeEventListener('keydown', lockRefresh);
      window.parent?.lockSidebarAndRefresh?.(false);
    }
    coInvoiceModal.querySelectorAll('.btn-cancel').forEach(button => {
      button.removeAttribute('onclick'); button.addEventListener('click', closeCOInvoice);
    });
    function calculateLine(line) {
      const discount = line.UnitPrice * line.Discount / 100;
      line.Taxable = round((line.UnitPrice - discount) * line.Quantity);
      line.VatTotal = round(line.Taxable * line.VatPer / 100);
      line.UnitTotal = round(line.Taxable + line.VatTotal);
      line.Ucost = round(line.Icost * line.Quantity);
      line.Umargin = round(line.Taxable - line.Ucost);
      line.stock = Math.max(0, line.OpenStock - line.Quantity);
      line.SValue = round(line.stock * line.Icost);
      line.CNQty = line.Quantity; // Original actual quantity when this new invoice is saved.
      return line;
    }
    function editorLine() {
      return calculateLine({Item:value('products'), PID:value('pid'), Quantity:number('qty'), UnitPrice:number('unit-price'),
        Discount:number('disc-per'), VatPer:number('vat-per'), Icost:number('i-cost'), OpenStock:number('o-stock'),
        ISize:value('i-size'), IRAL:value('i-ral'), IUnit:value('i-unit')});
    }
    function calculateEditor() {
      const line = editorLine();
      for (const [name, key] of Object.entries({'taxable':'Taxable','vat-total':'VatTotal','unit-total':'UnitTotal','u-cost':'Ucost','u-margin':'Umargin','s-value':'SValue'})) field(name).value = money(line[key]);
      field('disc-amt').value = money(line.UnitPrice * line.Discount / 100);
      field('a-stock').value = line.stock;
      return line;
    }
    window.calculateCOInvoiceTotal = calculateEditor;
    ['qty','unit-price','disc-per','vat-per','i-cost','o-stock'].forEach(name => {
      field(name).addEventListener('input', calculateEditor); field(name).addEventListener('change', calculateEditor);
    });
    function totals() {
      const sum = key => round(lines.reduce((total, line) => total + line[key], 0));
      for (const [name,key] of Object.entries({'taxable-value':'Taxable','total-vat':'VatTotal','grand-total':'UnitTotal','t-cost':'Ucost','t-margin':'Umargin'})) field(name).value = money(sum(key));
      field('amount-in-words').value = toWordsConfig.convert(sum('UnitTotal'));
    }
    function resetEditor() {
      editing = -1; add.textContent = 'ADD ITEM';
      for (const [name, val] of Object.entries({products:'','item-code':'',qty:1,'i-size':'-','i-ral':'-','i-unit':'-',
        'unit-price':0,'disc-per':0,'vat-per':5,'i-cost':0,'o-stock':0,pid:''})) field(name).value = val;
      calculateEditor();
    }
    function valid(line) {
      if (!line.Item || !line.PID) return 'Please select a product from the search results.';
      if (!Number.isSafeInteger(line.Quantity) || line.Quantity <= 0) return 'Quantity must be a positive whole number.';
      if (!Number.isFinite(line.UnitPrice) || line.UnitPrice <= 0) return 'Please enter a unit price greater than zero.';
      if (line.Discount < 0 || line.Discount > 100 || line.VatPer < 0) return 'Please check discount and VAT percentages.';
      return '';
    }
    function render() {
      body.replaceChildren();
      lines.forEach((line,index) => {
        const row = document.createElement('tr');
        const values = [index+1,line.Item,line.Quantity,line.CNQty,line.ISize,line.IRAL,line.IUnit,money(line.UnitPrice),
          money(line.Discount),money(line.VatPer),money(line.Taxable),money(line.VatTotal),money(line.UnitTotal),
          line.PID,line.stock,money(line.Icost),money(line.Ucost),money(line.SValue),money(line.Umargin),'Delivered'];
        values.forEach((val,column) => {
          const cell = document.createElement('td'); cell.textContent = val ?? ''; cell.className = column===1?'text-start':'text-end';
          row.appendChild(cell);
        });
        row.title='Right-click or long-press for Edit / Delete';
        row.addEventListener('dblclick',event=>{if(!event.target.closest('input,button'))openItemEditor(index);});
        row.addEventListener('contextmenu',event=>{event.preventDefault();event.stopPropagation();clearTimeout(holdTimer);showItemMenu(index,event.clientX,event.clientY);});
        let touchStart;
        row.addEventListener('pointerdown',event=>{
          if(event.pointerType==='mouse'||event.target.closest('input,button'))return;
          touchStart={x:event.clientX,y:event.clientY};clearTimeout(holdTimer);
          holdTimer=setTimeout(()=>showItemMenu(index,event.clientX,event.clientY),550);
        });
        row.addEventListener('pointermove',event=>{if(touchStart&&Math.hypot(event.clientX-touchStart.x,event.clientY-touchStart.y)>10)clearTimeout(holdTimer);});
        for(const type of ['pointerup','pointercancel'])row.addEventListener(type,()=>clearTimeout(holdTimer));
        body.appendChild(row);
      });
    }
    // Manager reveal: same password and 30-second activity timer as New Invoice.
    const secretCountdown=document.getElementById('co-newinvo-countdown-seconds');
    let secretTimer=null, secretSeconds=30;
    function lockCOInvoiceSecrets() {
      form.classList.remove('show-secret'); table.classList.remove('show-secret');
      itemForm?.classList.remove('show-secret');
      secretCountdown.style.display='none';
      if(secretTimer!==null) clearInterval(secretTimer); secretTimer=null;
    }
    function refreshSecretTimer() {
      if(secretTimer!==null) clearInterval(secretTimer);
      secretSeconds=30;secretCountdown.textContent=secretSeconds;secretCountdown.style.display='block';
      secretTimer=setInterval(()=>{secretCountdown.textContent=--secretSeconds;if(secretSeconds<=0)lockCOInvoiceSecrets();},1000);
    }
    form.addEventListener('dblclick',event=>{
      if(event.target.closest('input,button,select,textarea,a,table'))return;
      if(form.classList.contains('show-secret'))return lockCOInvoiceSecrets();
      const password=prompt('Enter manager password to view restricted columns:');
      if(password==='admin123'){form.classList.add('show-secret');table.classList.add('show-secret');refreshSecretTimer();}
      else if(password!==null)alert('Incorrect password. Access denied.');
    });
    for(const activity of ['mousemove','keypress','input','pointerdown'])form.addEventListener(activity,()=>{if(form.classList.contains('show-secret'))refreshSecretTimer();});
    // Reuse the New Invoice item modal's HTML and its established responsive CSS.
    const itemModal=document.getElementById('co-invitems-modal-overlay');
    const itemForm=document.getElementById('co-invitems-transaction-form');
    const itemField=name=>document.getElementById('co-invitems-'+name);
    const itemMenu=document.createElement('div');itemMenu.id='co-invoice-items-context-menu';itemMenu.style.cssText='display:none;position:fixed;z-index:1000000;min-width:160px;padding:4px;background:#1e1e2d;border:1px solid #2d2d44;border-radius:5px;';
    itemMenu.innerHTML='<button type="button" data-action="EDIT">Edit this Item</button><button type="button" data-action="DELETE">Delete this Item</button>';document.body.appendChild(itemMenu);
    let selectedItem=-1, itemIndex=-1, holdTimer=null;
    function hideItemMenu(){itemMenu.style.display='none';}
    function closeItemEditor(){itemModal.style.display='none';itemIndex=-1;}
    function calculateItemEditor(){
      if(itemModal.dataset.owner!=='co-invoice'||itemIndex<0||!lines[itemIndex])return null;
      const draft=calculateLine({...lines[itemIndex],Quantity:Number(itemField('qty').value),UnitPrice:Number(itemField('unit-price').value),
        Discount:Number(itemField('disc-per').value),VatPer:Number(itemField('vat-per').value),
        ISize:itemField('i-size').value,IRAL:itemField('i-ral').value,IUnit:itemField('i-unit').value});
      for(const [name,key]of Object.entries({'taxable':'Taxable','vat-total':'VatTotal','unit-total':'UnitTotal','u-cost':'Ucost','u-margin':'Umargin','s-value':'SValue'}))itemField(name).value=money(draft[key]);
      itemField('disc-amt').value=money(draft.UnitPrice*draft.Discount/100);itemField('a-stock').value=draft.stock;
      return draft;
    }
    function openItemEditor(index){
      const line=lines[index];if(!line||busy)return;hideItemMenu();itemIndex=index;itemModal.dataset.owner='co-invoice';
      document.getElementById('co-invitems-title-text').textContent=matchMedia('(max-width: 767px)').matches?'Edit Row - Sr No- '+(index+1):'EDIT INVOICE ITEM - Sr No: '+(index+1);
      for(const [name,key]of Object.entries({product:'Item',pid:'PID',qty:'Quantity','i-size':'ISize','i-ral':'IRAL','i-unit':'IUnit',
        'unit-price':'UnitPrice','disc-per':'Discount','vat-per':'VatPer','i-cost':'Icost','o-stock':'OpenStock'}))itemField(name).value=line[key]??'';
      itemField('sr-number').value=index+1;calculateItemEditor();
      itemForm.classList.toggle('show-secret',form.classList.contains('show-secret'));
      itemModal.style.display='flex';updateItemViewport();
    }
    for(const name of ['qty','unit-price','disc-per','vat-per'])itemField(name).addEventListener('input',calculateItemEditor);
    itemModal.querySelectorAll('.btn-cancel').forEach(button=>{button.removeAttribute('onclick');button.addEventListener('click',closeItemEditor);});
    document.getElementById('co-invitems-update-button').addEventListener('click',()=>{
      const draft=calculateItemEditor();if(!draft)return;const error=valid(draft);if(error)return alert(error);
      lines[itemIndex]=draft;closeItemEditor();resetEditor();render();totals();
    });
    for(const activity of ['pointerdown','input','keypress'])itemForm.addEventListener(activity,()=>{if(form.classList.contains('show-secret'))refreshSecretTimer();});
    function showItemMenu(index,x,y){
      if(!lines[index]||busy)return;selectedItem=index;itemMenu.style.display='block';
      itemMenu.style.left=Math.max(6,Math.min(x,innerWidth-itemMenu.offsetWidth-6))+'px';
      itemMenu.style.top=Math.max(6,Math.min(y,innerHeight-itemMenu.offsetHeight-6))+'px';
    }
    itemMenu.addEventListener('click',event=>{
      const action=event.target.closest('[data-action]')?.dataset.action;if(!action)return;
      hideItemMenu();
      if(action==='EDIT')openItemEditor(selectedItem);
      else if(action==='DELETE'&&lines[selectedItem]&&confirm('Delete this invoice item?')){
        lines.splice(selectedItem,1);selectedItem=-1;resetEditor();render();totals();
      }
    });
    document.addEventListener('pointerdown',event=>{if(!event.target.closest('#co-invoice-items-context-menu'))hideItemMenu();});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'){hideItemMenu();if(itemModal.style.display==='flex')closeItemEditor();}});
    function updateItemViewport(){
      const viewport=window.visualViewport;
      itemModal.style.setProperty('--item-visible-height',(viewport?.height??innerHeight)+'px');
      itemModal.style.setProperty('--item-visible-top',(viewport?.offsetTop??0)+'px');
    }
    window.visualViewport?.addEventListener('resize',updateItemViewport);
    window.visualViewport?.addEventListener('scroll',updateItemViewport);
    window.addEventListener('resize',updateItemViewport);

    add.addEventListener('click', () => {
      const line=calculateEditor(), error=valid(line); if(error) return alert(error);
      if(lines.some((existing,index)=>index!==editing && String(existing.PID)===String(line.PID))) return alert('This product is already in the invoice.');
      if(editing>=0) lines[editing]=line; else lines.push(line);
      render(); totals(); resetEditor();
    });
    document.getElementById('co-context-menu').addEventListener('click', async event => {
      if(event.target.closest('.co-context-item')?.dataset.action!=='CREATE INVOICE' || loading || busy) return;
      if(activeSelectedCOStatus==='DELIVERED'||event.target.closest('.co-context-item').getAttribute('aria-disabled')==='true')return;
      const key=String(activeSelectedCONo??'').trim(); if(!key) return alert('Please select a Customer Order first.');
      document.getElementById('co-context-menu').style.display='none'; loading=true;
      try {
        const response=await fetch('/api/get-co-details?CONo='+encodeURIComponent(key));
        const result=await response.json();
        if(!response.ok || !result.success) throw new Error(result.error||'Could not load Customer Order.');
        if(!Array.isArray(result.items) || !result.items.length) throw new Error('This Customer Order has no items.');
        const master=result.master;lockCOInvoiceSecrets();form.reset();
        const map={Customer:'customer',PostBox:'postbox',Emirate:'emirate',Address:'address',VatID:'vat-no',PaymentTerms:'payment-terms',
          CustContact:'contact-person',CustConNumber:'contact-number',ProjectName:'project-name',OurContact:'our-contact',OurNumber:'our-number',Description:'notes'};
        Object.entries(map).forEach(([key,name])=>field(name).value=master[key]??'');
        field('invoice-date').value=today(); field('deliver-date').value=today();
        field('lpo-no').value=master.LPONo??'-'; field('co-no').value=master.CONo;
        const deliverable=result.items.filter(item=>['pending','partial'].includes(String(item.Status??'').trim().toLowerCase()) && Number(item.Quantity)-Number(item.DQuantity??0)>0);
        if(!deliverable.length)throw new Error('This Customer Order has no pending quantities to invoice.');
        lines=deliverable.map(item=>calculateLine({Item:item.Item??'',PID:String(item.PID??''),Quantity:Number(item.Quantity)-Number(item.DQuantity??0),SourceCOSrNo:Number(item.SrNo),SourceCOItemID:String(item.ID??item._id??''),
          UnitPrice:Number(item.UnitPrice)||0,Discount:Number(item.Discount)||0,VatPer:Number(item.VatPer)||0,
          Icost:Number(item.LiveCost??item.Icost)||0,OpenStock:Number(item.LiveStockCount??item.Stock)||0,
          ISize:item.ISize??'-',IRAL:item.IRAL??'-',IUnit:item.IUnit??'-'}));
        coInvoiceModal.dataset.coNo=String(master.CONo);sourceRequestId=window.crypto?.randomUUID?.() || ('co-invoice-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)+'-'+Math.random().toString(36).slice(2));
        document.getElementById('co-newinvo-modal-title').textContent='NEW INVOICE FROM CUSTOMER ORDER - '+master.CONo;
        resetEditor(); render(); totals();
        window.parent?.lockSidebarAndRefresh?.(true); window.addEventListener('keydown',lockRefresh);
        coInvoiceModal.style.display='flex';
      } catch(error) { alert('Could not create invoice: '+error.message); }
      finally { loading=false; }
    });
    save.addEventListener('click', async () => {
      if(busy) return;
      if(!value('customer') || !value('invoice-date')) return alert('Customer and invoice date are required.');
      if(!lines.length) return alert('Please add at least one invoice item.');
      for(const line of lines) { const error=valid(line); if(error) return alert(error); }
      totals();
      const mapping={Customer:'customer',PostBox:'postbox',Emirate:'emirate',Address:'address',VatID:'vat-no',InvoiceDate:'invoice-date',
        LPONo:'lpo-no',CONo:'co-no',PaymentTerms:'payment-terms',CustContact:'contact-person',CustConNumber:'contact-number',
        ProjectName:'project-name',DeliveryDate:'deliver-date',OurContact:'our-contact',OurNumber:'our-number',Description:'notes',InWords:'amount-in-words'};
      const main=Object.fromEntries(Object.entries(mapping).map(([key,name])=>[key,value(name)]));
      for(const [key,name] of Object.entries({SubTotal:'taxable-value',VatTotal:'total-vat',GrandTotal:'grand-total',InvCost:'t-cost',InvMargin:'t-margin'})) main[key]=number(name);
      const items=lines.map((line,index)=>({...line,SrNo:index+1}));
      busy=true; save.disabled=true; save.textContent='Saving…';
      let allocated;
      try {
        const response=await fetch('/api/save-newinvoice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({main,items,sourceCO:{CONo:coInvoiceModal.dataset.coNo,requestId:sourceRequestId}})});
        const result=await response.json(); if(!response.ok || !result.success) throw new Error(result.message||result.error||'Could not save invoice.');
        allocated=result.allocatedNumber;
      } catch(error) { alert('Could not save invoice: '+error.message); return; }
      finally { busy=false; save.disabled=false; save.textContent='Save'; }
      closeCOInvoice(); form.reset(); lines=[]; body.replaceChildren(); resetEditor(); totals();
      // Match Index New Invoice: open Invoices and select View Invoices.
      try {
        const host=window.parent || window;
        const parentDoc=host.document;
        if(typeof host.setActiveSidebarItem==='function')host.setActiveSidebarItem('/invoices');
        const button=parentDoc.getElementById('btn-invoices');
        const menu=parentDoc.getElementById('menu-invoices');
        if(button && (!menu || menu.style.display!=='block'))button.click();
        const link=parentDoc.getElementById('view-invoices');
        if(link){link.click();link.classList.add('active');}
        const frame=parentDoc.getElementById('main-content-viewport') || parentDoc.querySelector('iframe[name="content-frame"]');
        if(frame)frame.src='/invoices';
      }catch(error){console.error('Invoice saved, but invoice view could not refresh:',error);}
      alert('Success! Invoice saved as No: '+allocated);
    });
    // Mobile grouping is independent of desktop positions.
    const rows=Array.from(form.children).filter(node=>node.tagName==='DIV');
    const titles=['Customer Details','Invoice Details','Item Details','Amounts & Costs','Totals & Stock'];
    rows.filter(row=>!row.contains(table)).forEach((row,index)=>{
      row.classList.add('co-invoice-section','is-closed');
      const toggle=document.createElement('button'); toggle.type='button'; toggle.className='co-invoice-toggle';
      toggle.textContent=titles[index]||'Details'; toggle.setAttribute('aria-expanded','false');
      toggle.addEventListener('click',()=>{const open=row.classList.toggle('is-closed')===false;toggle.setAttribute('aria-expanded',String(open));});
      row.before(toggle);
    });
    rows.find(row=>row.contains(table))?.classList.add('co-invoice-table-section');
    form.addEventListener('invalid',event=>{const section=event.target.closest('.co-invoice-section');if(section){section.classList.remove('is-closed');section.previousElementSibling?.setAttribute('aria-expanded','true');}},true);
  }
//#endregion

 // Delete CO: confirmation only for now; password confirmation can be added here later.
 let coDeleteBusy=false;
 document.getElementById('co-context-menu').addEventListener('click',async event=>{
  const action=event.target.closest('.co-context-item');if(action?.dataset.action!=='DELETE'||coDeleteBusy)return;
  document.getElementById('co-context-menu').style.display='none';
  const key=String(activeSelectedCONo??'').trim();if(!key)return alert('Please select a Customer Order first.');
  if(!confirm(`Delete Customer Order ${key}?${activeSelectedCOCustomer?'\nCustomer: '+activeSelectedCOCustomer:''}\n\nClick OK to delete this Customer Order.`))return;
  coDeleteBusy=true;const label=action.textContent;action.textContent='Deleting…';action.setAttribute('aria-busy','true');action.setAttribute('aria-disabled','true');
  try{
   const response=await fetch('/api/delete-co',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({CONo:key})});
   const data=await response.json();if(!response.ok||!data.success)throw Error(data.error||'Could not delete Customer Order.');
   activeSelectedCONo=null;activeSelectedCOId=null;activeSelectedCOCustomer='';fetchFilteredCO();alert(data.message||'Customer Order deleted successfully.');
  }catch(error){alert(error.message);}
  finally{coDeleteBusy=false;action.textContent=label;action.removeAttribute('aria-busy');action.removeAttribute('aria-disabled');}
 });

 // Full CO report has independent controls; it is not limited to the selected ledger row.
 const reportOverlay=document.createElement('div');reportOverlay.id='co-report-full-modal-overlay';reportOverlay.style.display='none';
 reportOverlay.innerHTML=`<div class="co-report-dialog" role="dialog" aria-modal="true" aria-labelledby="co-report-title">
  <header><h4 id="co-report-title">Customer Orders Report</h4><button type="button" data-report-close aria-label="Close">×</button></header>
  <form id="co-report-form"><div id="co-report-customer-group" hidden><label>Customer<input id="co-report-customer" type="text" role="combobox" aria-autocomplete="list" aria-controls="co-report-customer-list" aria-expanded="false" autocomplete="off" class="form-control form-control-sm" placeholder="Select or enter customer name"></label><ul id="co-report-customer-list" class="list-group d-none" role="listbox" aria-label="Customer suggestions"></ul></div><div class="co-report-fields">
   <label>Type<select id="co-report-type" class="form-control form-control-sm"><option value="ALL">All</option><option value="DELIVERED">Delivered</option><option value="PENDING">Pending</option></select></label>
   <label>Range<select id="co-report-range" class="form-control form-control-sm"></select></label>
   <label>From Date<input id="co-report-from" type="date" class="form-control form-control-sm"></label>
   <label>To Date<input id="co-report-to" type="date" class="form-control form-control-sm"></label>
  </div><p class="co-report-note">Pending includes partially delivered orders.</p>
  <footer><button type="button" data-report-close class="btn btn-sm btn-danger">Close</button><button type="submit" id="co-report-create" class="btn btn-sm btn-success">Create PDF</button></footer></form>
 </div>`;document.body.appendChild(reportOverlay);
 const reportRange=document.getElementById('co-report-range'),reportFrom=document.getElementById('co-report-from'),reportTo=document.getElementById('co-report-to'),reportCreate=document.getElementById('co-report-create');
 reportRange.innerHTML=document.getElementById('filter-co-range').innerHTML+'<option value="CUSTOM">Custom Dates</option>';
 let reportBusy=false,reportPreviousFocus=null,reportSingle=false;
 const reportCustomer=document.getElementById('co-report-customer');
 let customerSearchTimer=null,customerSearchSequence=0,customerActiveIndex=-1;
 const customerList=document.getElementById('co-report-customer-list');
 function hideReportCustomers(){clearTimeout(customerSearchTimer);customerSearchSequence++;customerList.classList.add('d-none');reportCustomer.setAttribute('aria-expanded','false');reportCustomer.removeAttribute('aria-activedescendant');customerActiveIndex=-1;}
 function selectReportCustomer(name){reportCustomer.value=name;hideReportCustomers();reportCustomer.focus();}
 reportCustomer.addEventListener('input',()=>{
  const start=reportCustomer.selectionStart,end=reportCustomer.selectionEnd;reportCustomer.value=reportCustomer.value.toUpperCase();if(start!==null&&end!==null)reportCustomer.setSelectionRange(start,end);
  hideReportCustomers();customerList.replaceChildren();const query=reportCustomer.value.trim(),sequence=customerSearchSequence;if(!query)return;
  customerSearchTimer=setTimeout(async()=>{try{
   const response=await fetch('/api/customers/search?q='+encodeURIComponent(query));if(!response.ok)throw Error('Customer search failed.');const customers=await response.json();
   if(sequence!==customerSearchSequence||!Array.isArray(customers)||document.activeElement!==reportCustomer||reportBusy||reportOverlay.style.display==='none')return;
   customerList.replaceChildren();
   customers.forEach((customer,index)=>{const name=String(customer.name??'').toUpperCase(),option=document.createElement('li');option.id='co-report-customer-option-'+index;option.className='list-group-item list-group-item-action py-1 px-1';option.setAttribute('role','option');option.setAttribute('aria-selected','false');option.textContent=name;option.addEventListener('click',()=>selectReportCustomer(name));customerList.appendChild(option);});
   customerList.classList.toggle('d-none',customers.length===0);reportCustomer.setAttribute('aria-expanded',String(customers.length>0));
  }catch(error){if(sequence===customerSearchSequence)hideReportCustomers();console.error('Customer report search failed:',error);}},200);
 });
 reportCustomer.addEventListener('keydown',event=>{
  const options=[...customerList.children];
  if(event.key==='Escape'&&!customerList.classList.contains('d-none')){event.preventDefault();event.stopPropagation();hideReportCustomers();return;}
  if(event.key==='Tab'){hideReportCustomers();return;}
  if(customerList.classList.contains('d-none')||!options.length)return;
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){
   event.preventDefault();customerActiveIndex=(customerActiveIndex+(event.key==='ArrowDown'?1:-1)+options.length)%options.length;
   options.forEach((option,index)=>{option.classList.toggle('active',index===customerActiveIndex);option.setAttribute('aria-selected',String(index===customerActiveIndex));});reportCustomer.setAttribute('aria-activedescendant',options[customerActiveIndex].id);const option=options[customerActiveIndex];if(option.offsetTop<customerList.scrollTop)customerList.scrollTop=option.offsetTop;else if(option.offsetTop+option.offsetHeight>customerList.scrollTop+customerList.clientHeight)customerList.scrollTop=option.offsetTop+option.offsetHeight-customerList.clientHeight;
  }else if(event.key==='Enter'&&customerActiveIndex>=0){event.preventDefault();selectReportCustomer(options[customerActiveIndex].textContent);}
 });
 document.addEventListener('pointerdown',event=>{if(!event.target.closest('#co-report-customer-group')&&!customerList.contains(event.target))hideReportCustomers();});
 // Float suggestions outside the dialog so they cannot expand its scroll area.
 const customerListHome=document.getElementById('co-report-customer-group');
 function placeReportSuggestions(){
  if(customerList.classList.contains('d-none'))return;
  const rect=reportCustomer.getBoundingClientRect(),viewport=window.visualViewport;
  const top=viewport?.offsetTop??0,bottom=top+(viewport?.height??innerHeight),below=bottom-rect.bottom-8,above=rect.top-top-8;
  const useAbove=below<100&&above>below,height=Math.max(30,Math.min(180,useAbove?above:below));
  customerList.style.setProperty('position','fixed','important');customerList.style.setProperty('left',rect.left+'px','important');customerList.style.setProperty('right','auto','important');customerList.style.setProperty('width',rect.width+'px','important');customerList.style.setProperty('max-height',height+'px','important');customerList.style.setProperty('top',(useAbove?Math.max(top+4,rect.top-Math.min(height,customerList.scrollHeight)-3):rect.bottom+3)+'px','important');customerList.style.setProperty('z-index','1000002','important');
 }
 new MutationObserver(()=>{
  if(customerList.classList.contains('d-none')){if(customerList.parentElement!==customerListHome)customerListHome.appendChild(customerList);}
  else{if(customerList.parentElement!==document.body)document.body.appendChild(customerList);placeReportSuggestions();}
 }).observe(customerList,{attributes:true,attributeFilter:['class'],childList:true});
 window.addEventListener('resize',placeReportSuggestions);
 window.visualViewport?.addEventListener('resize',placeReportSuggestions);
 window.visualViewport?.addEventListener('scroll',placeReportSuggestions);
 document.addEventListener('scroll',event=>{if(event.target!==customerList)placeReportSuggestions();},true);
 const sqlDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
 function setReportDates(){
  const now=new Date(),range=reportRange.value;let from=null,to=now;
  if(range==='CUSTOM')return;
  if(range==='FULL'){reportFrom.value='';reportTo.value='';return;}
  if(range==='CURRENT_MONTH')from=new Date(now.getFullYear(),now.getMonth(),1);
  else if(range==='LAST_MONTH'){from=new Date(now.getFullYear(),now.getMonth()-1,1);to=new Date(now.getFullYear(),now.getMonth(),0);}
  else if(range==='CURRENT_YEAR')from=new Date(now.getFullYear(),0,1);
  else if(['2MONTH','3MONTH','6MONTH'].includes(range))from=new Date(now.getFullYear(),now.getMonth()+1-Number(range.replace('MONTH','')),1);
  reportFrom.value=from?sqlDate(from):'';reportTo.value=sqlDate(to);
 }
 function closeCOReport(){if(reportBusy)return;hideReportCustomers();reportOverlay.style.display='none';window.parent?.lockSidebarAndRefresh?.(false);reportPreviousFocus?.focus();}
 reportRange.addEventListener('change',setReportDates);
 for(const control of [reportFrom,reportTo])control.addEventListener('change',()=>reportRange.value='CUSTOM');
 reportOverlay.querySelectorAll('[data-report-close]').forEach(button=>button.addEventListener('click',closeCOReport));
 reportOverlay.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();closeCOReport();}
  if(event.key==='Tab'){const controls=[...reportOverlay.querySelectorAll('button,select,input')].filter(e=>!e.disabled&&!e.closest('[hidden]')),first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
 });
 document.getElementById('co-context-menu').addEventListener('click',event=>{
  const action=event.target.closest('.co-context-item')?.dataset.action;if(!['CO REPORT FULL','CO REPORT SINGLE'].includes(action))return;
  hideReportCustomers();reportSingle=action==='CO REPORT SINGLE';document.getElementById('co-report-customer-group').hidden=!reportSingle;reportCustomer.required=reportSingle;reportCustomer.value=reportSingle?String(activeSelectedCOCustomer).toUpperCase():'';document.getElementById('co-report-title').textContent=reportSingle?'Customer Orders Report - Single Customer':'Customer Orders Report';
  document.getElementById('co-context-menu').style.display='none';reportPreviousFocus=document.activeElement;
  document.getElementById('co-report-type').value='ALL';reportRange.value=document.getElementById('filter-co-range').value||'3MONTH';setReportDates();
  reportOverlay.style.display='flex';window.parent?.lockSidebarAndRefresh?.(true);(reportSingle?reportCustomer:document.getElementById('co-report-type')).focus();
 });
 document.getElementById('co-report-form').addEventListener('submit',async event=>{
  event.preventDefault();if(reportBusy)return;
  if(reportRange.value==='CUSTOM'&&!reportFrom.value&&!reportTo.value)return alert('Please select at least one date.');
  if(reportFrom.value&&reportTo.value&&reportFrom.value>reportTo.value)return alert('From Date must not be after To Date.');
  const type=document.getElementById('co-report-type').value;
  if(reportSingle&&!reportCustomer.value.trim())return alert('Please select a customer.');
  const payload={type,timeRange:reportRange.value,startDate:reportFrom.value,endDate:reportTo.value,...(reportSingle?{customer:reportCustomer.value.trim()}:{})};
  reportBusy=true;reportOverlay.querySelectorAll('button,input,select').forEach(e=>e.disabled=true);reportCreate.innerHTML='<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Creating…';
  try{
   const response=await fetch(reportSingle?'/api/co-report-single':'/api/co-report-full',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   if(!response.ok){const data=await response.json().catch(()=>({}));throw Error(data.error||'Could not generate report.');}
   const blob=await response.blob(),url=URL.createObjectURL(blob),link=document.createElement('a');
   link.href=url;link.download=`CO-Report-${reportSingle?payload.customer.replace(/[^a-zA-Z0-9 -]/g,'_')+'-':''}${type}-${payload.startDate||'ALL'}-${payload.endDate||'ALL'}.pdf`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  }catch(error){alert(error.message);}
  finally{reportBusy=false;reportOverlay.querySelectorAll('button,input,select').forEach(e=>e.disabled=false);reportCreate.textContent='Create PDF';}
 });

 // Pro-forma is generated from the complete CO; it never saves an invoice or changes stock.
 document.getElementById('co-context-menu').addEventListener('click',event=>{
  if(event.target.closest('.co-context-item')?.dataset.action!=='PRO-FORMA INVOICE')return;
  document.getElementById('co-context-menu').style.display='none';
  const key=String(activeSelectedCONo??'').trim();if(!key)return alert('Please select a Customer Order first.');
  window.location.href='/api/print-co-proforma/'+encodeURIComponent(key);
 });

 // Separate fetch API for opening the selected Customer Order.
 let coDetailsLoading=false;
 document.getElementById('co-context-menu').addEventListener('click',async event=>{
  if(event.target.closest('.co-context-item')?.dataset.action!=='EDIT'||coDetailsLoading)return;
  const key=String(activeSelectedCONo??'').trim();if(!key)return alert('Please select a Customer Order first.');
  document.getElementById('co-context-menu').style.display='none';coDetailsLoading=true;
  try{
   const response=await fetch('/api/get-co-details?CONo='+encodeURIComponent(key)),data=await response.json();
   if(!response.ok||!data.success)throw Error(data.error||data.message||'Could not load Customer Order.');
   window.loadEditCustomerOrder(data.master,data.items);
   window.parent?.lockSidebarAndRefresh?.(true);document.getElementById('editco-modal-overlay').style.display='flex';
  }catch(error){alert(error.message);}finally{coDetailsLoading=false;}
 });
 document.getElementById('editco-modal-overlay')?.querySelectorAll('.btn-cancel').forEach(button=>{
  button.removeAttribute('onclick');button.addEventListener('click',()=>{document.getElementById('editcoitems-modal-overlay').style.display='none';document.getElementById('editco-modal-overlay').style.display='none';window.parent?.lockSidebarAndRefresh?.(false);});
 });

}
//#endregion 
//==========================================================================================//    

//============================CLIENTS==============================================//
//#region 📌 CLIENTS CODE ALL INSERT HERE
function initClientPage() {
  let TotalClients = "";

//#region  LOAD CLIENTS FROM DATABASE
              const btnclientSearch = document.getElementById("btn-client-search");
              if (!btnclientSearch) return;               
              fetchFilteredClients();
//#endregion

//#region  CLIENTS SEARCH BUTTON CLICK EVENT
             btnclientSearch.addEventListener("click", fetchFilteredClients);

              //================ SEARCH EVENTS FOR RANGE, STATUS, QUOTATION NUMBER, CUSTOMER NAME ====================//
             
              // document.getElementById("search-client-emirate").addEventListener("input", () => 
              //   {
                  
              //     fetchFilteredClients();
              //   });
              document.getElementById("search-client-customer").addEventListener("input", () => 
                {
                  
                  fetchFilteredClients();
                });
//#endregion

//#region  FETCH CLIENTS FROM DATABASE FUNCTION
              
              function fetchFilteredClients() {
                document.getElementById("client-head").textContent = `Clients Registry`;
                const clientloadingOverlay = document.getElementById("client-loading-overlay");
                const clienttableBlock = document.getElementById("client-table-display-block");
                const clienttbody = document.getElementById("client-rows");
                
                clientloadingOverlay.style.display = "block";
                clienttableBlock.style.opacity = "0.4";

                const payload = {
                 
                  searchQuery: document.getElementById("search-client-customer").value.trim(),
                  
                };
               

                fetch("/api/customers", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                  
                })
                
                  .then((res) => res.json())
                  .then((data) => { 
                   // console.log("[ERP DEBUG] Clients Data Retrieved:", data.customers);
                    clienttbody.innerHTML = "";
                    clientloadingOverlay.style.display = "none";
                    clienttableBlock.style.opacity = "1.0";
                    
                    //TotalQuote = data.purchaseorders.length;//total purchaseorders count
                    if (
                      !data.success || !data.customers || data.customers.length === 0) {
                      
                      clienttbody.innerHTML =
                        '<tr><td colspan="13" class="text-center text-muted py-3">No matching Customers records found inside database registry.</td></tr>';
                      return;
                      
                    }
                    TotalClients = "";
                    TotalClients = data.customers.length;//total quotations count
                                       // 1. Extract all dates and convert them to timestamps
                    const timestamps = data.customers.map(customer => new Date(customer.CODate).getTime());
                    // 2. Find the minimum and maximum timestamps
                    const minTimestamp = Math.min(...timestamps);
                    const maxTimestamp = Math.max(...timestamps);                    
                    document.getElementById("client-head").innerHTML = `Customers (${TotalClients})`;
                    const now = new Date();
                    document.getElementById("client-head-date").innerHTML = formatToDdMMMyyyy(now);
                    //document.getElementById("cn-head").textContent = `Credit Notes Registry  (${TotalCN})`;
                    //document.getElementById("quote-head").textContent = `Quotations Registry  (${TotalQuote})`;

                    data.customers.forEach((client) => {
                      const row = document.createElement("tr");
                      TotalClients = client.length;//total purchaseorders count
                      // 2. 💡 CRITICAL FIX: Set your data markers directly onto the element object wrapper!
                      row.setAttribute('data-id', client._id || client.ID || "");
                      row.setAttribute('data-client', client.custname || "");
                      // let badgeClass = "text-danger";
                      // let rowTextColorStyle = ""; // 🎯 Holder for row inline color styles
                      // 2. 🎨 MAP ROW TEXT COLOR DIRECTLY TO FINANCIAL REGISTRY STATUSES
                      // const coStatusValues = (co.Status || "Pending").toUpperCase();

                      // if (coStatusValues === "Delivered" || coStatusValues === "DELIVERED") {
                      //   //badgeClass = "bg-success";
                      //   rowTextColorStyle = "color: green;"; // green
                      // } else if (coStatusValues === "Pending" || coStatusValues === "PENDING") {
                      //   //badgeClass = "bg-warning text-dark";
                      //   rowTextColorStyle = "color: red;"; // red
                      // } else if (coStatusValues === "Partial" || coStatusValues === "PARTIAL") {
                      //   //badgeClass = "bg-info text-dark";
                      //   rowTextColorStyle = "color: blue;"; // purple
                      //  } 
                      //else if (
                      //   quoteTypeValues === "ADV.PAID" ||
                      //   quoteTypeValues === "ADVANCE PAID"
                      // ) {
                      //   badgeClass = "bg-danger";
                      //   rowTextColorStyle = "color: blue;"; //  blue text row
                      // }
                      //3. Inject the style attribute directly into the opening <tr> element node
                      // if (rowTextColorStyle) {
                      //   row.setAttribute("style", rowTextColorStyle);
                      // }
                      
                      row.innerHTML = `
                        <td>${client.ID}</td>                      
                        <td>${client.custname}</td>                        
                        <td>${client.emirate || "ABU DHABI"}</td>
                        <td style="font-size:10px !important;">${client.email}</td>                      
                        <td>${client.contact || "-"}</td>
                        <td>${client.phone || "-"}</td>
                        <td>${client.mobile || "-"}</td>
                    `;
                      clienttbody.appendChild(row);
                    });
                    
                  })
                  .catch((err) => {
                    console.error("Critical rendering pipeline issue:", err);
                    clientloadingOverlay.style.display = "none";
                    clienttableBlock.style.opacity = "1.0";
                    clienttbody.innerHTML =
                      '<tr><td colspan="13" class="text-center text-danger py-3">Error streaming dataset values. Check server connection metrics.</td></tr>';
                  });
                  
              }
              // 🎯 GLOBAL STORAGE TRACKER FOR THE ACTIVE SELECTED CREDIT NOTE DATA
              let activeSelectedClient = null;
              let activeSelectedClientId = null;
              
//#endregion

//#region  BUTTON CLIENTS RESET CLICK EVENT
              document.getElementById("btn-client-reset").addEventListener("click", () => 
                {
                  // document.getElementById("search-client-emirate").value = "";
                  document.getElementById("search-client-customer").value = "";
                  fetchFilteredClients();
                });
//#endregion ============ END BUTTON RESET CLICK EVENT ===================================//

//#region  OPEN CLIENTS DYNAMIC CONTEXT MENU
              document.getElementById("client-rows").addEventListener("contextmenu", function (e) {
                  const clickedRow = e.target.closest("tr");
                  if (!clickedRow) return;
                  e.preventDefault();
                  activeSelectedClientId = clickedRow.getAttribute("data-id") || "";
                  activeSelectedClient = clickedRow.getAttribute("data-client") || "";
                  activeSelectedClient = activeSelectedClient.replace(/<[^>]*>/g, "").trim();

                const oldHighlightedRow = document.querySelector("#client-rows tr.client-rows-highlight-context");
                if (oldHighlightedRow) {
                  oldHighlightedRow.classList.remove("client-rows-highlight-context");
                }
                clickedRow.classList.add("client-rows-highlight-context");

                const menuElement = document.getElementById("client-context-menu");
                menuElement.style.visibility = "hidden"; // Render invisibly first so it takes shape in the DOM
                menuElement.style.display = "block";

                const menuWidth = menuElement.offsetWidth || 150;
                const menuHeight = menuElement.offsetHeight || 120;
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;

                let targetX = e.clientX;
                if (e.clientX + menuWidth > windowWidth) {
                  targetX = windowWidth - menuWidth - 10; // 10px safety margin from window edge
                }
                
                let targetY = e.clientY;
                if (e.clientY + menuHeight > windowHeight) {
                  targetY = e.clientY - menuHeight; // Shifts the menu completely above your cursor
                  
                  if (targetY < 0) targetY = 10; 
                }
                
                menuElement.style.left = targetX + "px";
                menuElement.style.top = targetY + "px";
                menuElement.style.visibility = "visible"; 
                e.stopPropagation();
                });

              document.addEventListener("click", function (e) {
                const menuElement = document.getElementById(
                  "client-context-menu",
                );
                if (!e.target.closest("#client-context-menu")) {
                  menuElement.style.display = "none";
                  document
                    .querySelectorAll("#client-rows tr")
                    .forEach((row) =>
                      row.classList.remove("client-rows-highlight-context"),
                    );
                }
              });
//#endregion

 // Edit Customer uses the same compact form and IDs as New Customer in the separate page.
 const editCustomerModal=document.getElementById('newcust-modal-overlay'),editCustomerForm=document.getElementById('newcust-master-form'),updateCustomerButton=document.getElementById('btn-save-newcust');
 let editingCustomerKey='',customerEditLoading=false,customerUpdateBusy=false;
 const customerField=name=>document.getElementById('newcust-'+name);
 function closeCustomerEdit(){if(customerUpdateBusy)return;editCustomerModal.style.display='none';editCustomerForm.reset();editingCustomerKey='';window.parent?.lockSidebarAndRefresh?.(false);}
 editCustomerModal.querySelectorAll('.btn-cancel').forEach(button=>button.addEventListener('click',closeCustomerEdit));
 document.getElementById('client-context-menu').addEventListener('click',async event=>{
  if(event.target.closest('.client-context-item')?.dataset.action!=='EDIT'||customerEditLoading||customerUpdateBusy)return;
  const id=String(activeSelectedClientId??'').trim();if(!id)return alert('Please select a customer first.');
  document.getElementById('client-context-menu').style.display='none';customerEditLoading=true;
  try{
   const response=await fetch('/api/get-customer-details?id='+encodeURIComponent(id)),data=await response.json();if(!response.ok||!data.success)throw Error(data.error||'Could not load customer.');
   const record=data.customer;editCustomerForm.reset();editingCustomerKey=String(record._id??'');
   const fields={custname:'customer',postbox:'postbox',custaddress:'address',emirate:'emirate',VatID:'vat-no',contact:'contact-person',phone:'contact-number',mobile:'mobile-number',paymentterm:'payment-terms',email:'email'};
   for(const[key,name]of Object.entries(fields))customerField(name).value=record[key]??'';
   window.parent?.lockSidebarAndRefresh?.(true);editCustomerModal.style.display='flex';customerField('customer').focus();
  }catch(error){alert(error.message);}finally{customerEditLoading=false;}
 });
 editCustomerForm.addEventListener('submit',event=>{event.preventDefault();updateCustomerButton.click();});
 updateCustomerButton.addEventListener('click',async()=>{
  if(customerUpdateBusy)return;
  for(const[name,label]of [['customer','Name'],['address','Address'],['emirate','Emirate']])if(!customerField(name).value.trim()){alert(label+' is required.');customerField(name).focus();return;}
  const mapping={custname:'customer',postbox:'postbox',custaddress:'address',emirate:'emirate',VatID:'vat-no',contact:'contact-person',phone:'contact-number',mobile:'mobile-number',paymentterm:'payment-terms',email:'email'};
  const payload={customerId:editingCustomerKey,...Object.fromEntries(Object.entries(mapping).map(([key,name])=>[key,customerField(name).value.trim()||'N/A']))};
  customerUpdateBusy=true;updateCustomerButton.disabled=true;updateCustomerButton.textContent='Updating…';const cancel=[...editCustomerModal.querySelectorAll('.btn-cancel')];cancel.forEach(b=>b.disabled=true);
  try{
   const response=await fetch('/api/update-customer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}),data=await response.json();if(!response.ok||!data.success)throw Error(data.error||'Could not update customer.');
   customerUpdateBusy=false;closeCustomerEdit();fetchFilteredClients();alert(data.message||'Customer updated successfully.');
  }catch(error){alert(error.message);}finally{customerUpdateBusy=false;updateCustomerButton.disabled=false;updateCustomerButton.textContent='Update';cancel.forEach(b=>b.disabled=false);}
 });

//#region  FORMAT DATE TO DISPLAY DD-MMM-YYYY
              function formatToDdMMMyyyy(dateString) {
                if (!dateString) return "N/A";
                const dateObj = new Date(dateString);
                if (isNaN(dateObj.getTime())) return "N/A";
                const day = String(dateObj.getDate()).padStart(2, "0");
                const yy = String(dateObj.getFullYear()).slice(-2);
                const months = [
                  "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",
                ];
                return (
                  day + "-" + months[dateObj.getMonth()] + "-" + yy
                );
              }
//#endregion ============ END FORMAT DATE TO DISPLAY DD-MMM-YYYY===================================//

}
//#endregion 
//==========================================================================================//    

//============================PRODUCTS==============================================//
//#region 📌 PRODUCTS CODE ALL INSERT HERE
function initProductPage() {
  let TotalProducts = "";

//#region  LOAD PRODUCTS FROM DATABASE
              const btnproductSearch = document.getElementById("btn-products-search");
              if (!btnproductSearch) return;               
              fetchFilteredProducts();
//#endregion

//#region  PRODUCTS SEARCH BUTTON CLICK EVENT
             btnproductSearch.addEventListener("click", fetchFilteredProducts);

              //================ SEARCH EVENTS FOR RANGE, STATUS, QUOTATION NUMBER, CUSTOMER NAME ====================//
              // document.getElementById("search-products-id").addEventListener("input", () => 
              //   {
                  
              //     fetchFilteredProducts();
              //   });
              // document.getElementById("search-products-code").addEventListener("input", () => 
              //   {
                  
              //     fetchFilteredProducts();
              //   });
              document.getElementById("search-products-item").addEventListener("input", () => 
                {
                  
                  fetchFilteredProducts();
                });
                 document.getElementById("filter-products-status").addEventListener("change", (event) => 
                {
                  
                  fetchFilteredProducts();
                });
                 document.getElementById("filter-products-range").addEventListener("change", (event) => 
                {
                  
                  fetchFilteredProducts();
                });
//#endregion

//#region  FETCH PRODUCTS FROM DATABASE FUNCTION
              
              function fetchFilteredProducts() {
                document.getElementById("products-head").textContent = `Products Registry`;
                const productsloadingOverlay = document.getElementById("products-loading-overlay");
                const productstableBlock = document.getElementById("products-table-display-block");
                const productstbody = document.getElementById("products-rows");
                
                productsloadingOverlay.style.display = "block";
                productstableBlock.style.opacity = "0.4";

                const payload = {
                  // ID: document.getElementById("search-products-id").value.trim(),
                  // PID: document.getElementById("search-products-code").value.trim(),
                  searchQuery: document.getElementById("search-products-item").value.trim(),
                  Status: document.getElementById("filter-products-status").value,
                  Range: document.getElementById("filter-products-range").value,
                  // startDate: document.getElementById("filter-co-start-date").value,
                  // endDate: document.getElementById("filter-co-end-date").value,
                };
                //console.log("[ERP DEBUG] Credit Notes Data Retrieved:", payload);

                fetch("/api/products", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                  
                })
                
                  .then((res) => res.json())
                  .then((data) => { 
                   // console.log("[ERP DEBUG] Clients Data Retrieved:", data.customers);
                    productstbody.innerHTML = "";
                    productsloadingOverlay.style.display = "none";
                    productstableBlock.style.opacity = "1.0";
                    
                    //TotalQuote = data.purchaseorders.length;//total purchaseorders count
                    if (
                      !data.success || !data.products || data.products.length === 0) {
                      
                      productstbody.innerHTML =
                        '<tr><td colspan="13" class="text-center text-muted py-3">No matching Products records found inside database registry.</td></tr>';
                      return;
                      
                    }
                    TotalProducts = "";
                    TotalProducts = data.products.length;//total quotations count
                                       // 1. Extract all dates and convert them to timestamps
                    // const timestamps = data.products.map(product => new Date(product.CODate).getTime());
                    // // 2. Find the minimum and maximum timestamps
                    // const minTimestamp = Math.min(...timestamps);
                    // const maxTimestamp = Math.max(...timestamps);                    
                    document.getElementById("products-head").innerHTML = `Products (${TotalProducts})`;
                    //document.getElementById("cn-head").textContent = `Credit Notes Registry  (${TotalCN})`;
                    //document.getElementById("quote-head").textContent = `Quotations Registry  (${TotalQuote})`;

                    data.products.forEach((product) => {
                      const row = document.createElement("tr");
                      TotalProducts = product.length;//total purchaseorders count
                      // 2. 💡 CRITICAL FIX: Set your data markers directly onto the element object wrapper!
                      row.setAttribute('data-id', product._id || product.ID || "");
                      row.setAttribute('data-item', product.item || "");
                      let badgeClass = "text-danger";
                      let rowTextColorStyle = ""; // 🎯 Holder for row inline color styles
                      // 2. 🎨 MAP ROW TEXT COLOR DIRECTLY TO FINANCIAL REGISTRY STATUSES
                      // ${parseFloat(lpo.SubTotal || 0)
                      const stock = product.stock;
                      const productStatusValues = parseInt(stock);
                      if (productStatusValues > 0 ) {
                        //badgeClass = "bg-success";
                        rowTextColorStyle = "color: green;"; // green
                      } else if (productStatusValues <= 0) {
                        //badgeClass = "bg-warning text-dark";
                        rowTextColorStyle = "color: red;"; // red
                      } 
                      // else if (productStatusValues === "Partial" || productStatusValues === "PARTIAL") {
                      //   //badgeClass = "bg-info text-dark";
                      //   rowTextColorStyle = "color: blue;"; // purple
                      //  } 
                      //else if (
                      //   quoteTypeValues === "ADV.PAID" ||
                      //   quoteTypeValues === "ADVANCE PAID"
                      // ) {
                      //   badgeClass = "bg-danger";
                      //   rowTextColorStyle = "color: blue;"; //  blue text row
                      // }
                      // 3. Inject the style attribute directly into the opening <tr> element node
                      if (rowTextColorStyle) {
                        row.setAttribute("style", rowTextColorStyle);
                      }
                      
                      row.innerHTML = `
                        
                        <td>${product.ID}</td> <!-- 🎯 ADDED CLASS HERE TO HIDE CELL -->                       
                        <td> ${product.pid}</td>
                        <td>${product.item}</td>
                        <td style="text-align: center;">${parseInt(product.Ostock || 0)}</td>
                        <td style="text-align: center;">${parseInt(product.stock || 0)}</td> 
                        <td style="text-align: right;">${parseFloat(product.cost || 0).toFixed(2)}</td>
                        <td style="text-align: right;">${parseFloat(product.tcost || 0 ).toFixed(2)}</td>
                        <td style="text-align: right;">${parseFloat(product.price || 0 ).toFixed(2)}</td>
                        <td style="text-align: right;">${parseFloat(product.margin || 0).toFixed(2) }</td>
                        <td>${product.Iunit || "-"}</td>
                        <td>${product.IRAL || "-"}</td>
                        <td>${product.Isize || "-"}</td> 
                        <td>${product.User_name || "-"}</td>
                        
                    `;
                      productstbody.appendChild(row);
                    });
                    
                  })
                  .catch((err) => {
                    console.error("Critical rendering pipeline issue:", err);
                    productsloadingOverlay.style.display = "none";
                    productstableBlock.style.opacity = "1.0";
                    productstbody.innerHTML =
                      '<tr><td colspan="13" class="text-center text-danger py-3">Error streaming dataset values. Check server connection metrics.</td></tr>';
                  });
                  
              }
              // 🎯 GLOBAL STORAGE TRACKER FOR THE ACTIVE SELECTED PRODUCTS DATA
              let activeSelectedProduct = null;
              let activeSelectedProductId = null;
              
//#endregion

//#region  BUTTON PRODUCTS RESET CLICK EVENT
              document.getElementById("btn-products-reset").addEventListener("click", () => 
                {
                  // document.getElementById("search-products-code").value = "";
                  document.getElementById("search-products-item").value = "";
                  document.getElementById("filter-products-status").value = "ALL";
                  document.getElementById("filter-products-range").value = "A-E";
                  fetchFilteredProducts();
                });
//#endregion ============ END BUTTON RESET CLICK EVENT ===================================//

//#region  OPEN PRODUCTS DYNAMIC CONTEXT MENU
              document.getElementById("products-rows").addEventListener("contextmenu", function (e) {
                  const clickedRow = e.target.closest("tr");
                  if (!clickedRow) return;
                  e.preventDefault();
                  activeSelectedProductId = clickedRow.getAttribute("data-id") || "";
                  activeSelectedProduct = clickedRow.getAttribute("data-item") || "";
                  activeSelectedProduct = activeSelectedProduct.replace(/<[^>]*>/g, "").trim();

                const oldHighlightedRow = document.querySelector("#products-rows tr.products-rows-highlight-context");
                if (oldHighlightedRow) {
                  oldHighlightedRow.classList.remove("products-rows-highlight-context");
                }
                clickedRow.classList.add("products-rows-highlight-context");

                const menuElement = document.getElementById("products-context-menu");
                menuElement.style.visibility = "hidden"; // Render invisibly first so it takes shape in the DOM
                menuElement.style.display = "block";

                const menuWidth = menuElement.offsetWidth || 150;
                const menuHeight = menuElement.offsetHeight || 120;
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;

                let targetX = e.clientX;
                if (e.clientX + menuWidth > windowWidth) {
                  targetX = windowWidth - menuWidth - 10; // 10px safety margin from window edge
                }
                
                let targetY = e.clientY;
                if (e.clientY + menuHeight > windowHeight) {
                  targetY = e.clientY - menuHeight; // Shifts the menu completely above your cursor
                  
                  if (targetY < 0) targetY = 10; 
                }
                
                menuElement.style.left = targetX + "px";
                menuElement.style.top = targetY + "px";
                menuElement.style.visibility = "visible"; 
                e.stopPropagation();
                });

              document.addEventListener("click", function (e) {
                const menuElement = document.getElementById(
                  "products-context-menu",
                );
                if (!e.target.closest("#products-context-menu")) {
                  menuElement.style.display = "none";
                  document
                    .querySelectorAll("#products-rows tr")
                    .forEach((row) =>
                      row.classList.remove("products-rows-highlight-context"),
                    );
                }
              });
//#endregion

 // Product edit uses the copied New Product layout in the separate products page.
 const productModal=document.getElementById('newprod-modal-overlay'),productForm=document.getElementById('newprod-invoice-master-form'),productUpdate=document.getElementById('btn-save-newprod');
 let productLoading=false,productUpdating=false,productOriginal=null;
 const productField=name=>document.getElementById('newprod-'+name);
 function populateProduct(record){
  productForm.reset();const mapping={pid:'item-code',item:'products',price:'unit-price',cost:'unit-cost',margin:'margin-per',Iunit:'unit',IRAL:'ral',Isize:'size'};
  for(const[key,name]of Object.entries(mapping))productField(name).value=record[key]??(['price','cost'].includes(key)?'1.00':['margin'].includes(key)?'0':'-');
  // Current stock is the editing baseline; Add Stock always starts at zero.
  productField('open-stock').value=Number(record.stock)||0;productField('add-stock').value=0;productField('open-stock').dispatchEvent(new Event('input',{bubbles:true}));
 }
 function closeProductEdit(){if(productUpdating)return;productModal.style.display='none';productOriginal=null;window.parent?.lockSidebarAndRefresh?.(false);}
 productModal.querySelectorAll('.btn-cancel').forEach(button=>button.addEventListener('click',closeProductEdit));
 [...productForm.querySelectorAll('button')].find(button=>button.textContent.trim()==='RESET')?.addEventListener('click',()=>{if(productOriginal)populateProduct(productOriginal);});
 document.getElementById('products-context-menu').addEventListener('click',async event=>{
  if(event.target.closest('.products-context-item')?.dataset.action!=='EDIT'||productLoading||productUpdating)return;const key=String(activeSelectedProductId??'').trim();if(!key)return alert('Please select a product first.');document.getElementById('products-context-menu').style.display='none';productLoading=true;
  try{const response=await fetch('/api/get-product-details?id='+encodeURIComponent(key)),data=await response.json();if(!response.ok||!data.success)throw Error(data.error||'Could not load product.');productOriginal=data.product;populateProduct(productOriginal);productModal.style.display='flex';window.parent?.lockSidebarAndRefresh?.(true);}
  catch(error){alert(error.message);}finally{productLoading=false;}
 });
 productForm.addEventListener('submit',event=>{event.preventDefault();productUpdate.click();});
 productUpdate.addEventListener('click',async()=>{
  if(productUpdating||!productOriginal)return;
  for(const[name,label]of [['item-code','Product Code'],['products','Product']])if(!productField(name).value.trim()){alert(label+' is required.');productField(name).focus();return;}
  const payload={productId:String(productOriginal._id),expectedStock:Number(productOriginal.stock)||0,pid:productField('item-code').value.trim(),item:productField('products').value.trim(),Iunit:productField('unit').value.trim()||'-',IRAL:productField('ral').value.trim()||'-',Isize:productField('size').value.trim()||'-'};
  for(const[key,name]of Object.entries({price:'unit-price',cost:'unit-cost',margin:'margin-per',Ostock:'open-stock',addStock:'add-stock'})){const value=productField(name).value.trim();if(!value||!Number.isFinite(Number(value)))return alert('Please enter valid product amounts and quantities.');payload[key]=Number(value);}
  if(payload.price<0||payload.cost<0||payload.Ostock<0||payload.addStock<0||!Number.isSafeInteger(payload.Ostock)||!Number.isSafeInteger(payload.addStock))return alert('Stock must be a nonnegative whole number. Price and cost cannot be negative.');
  productUpdating=true;productUpdate.disabled=true;productUpdate.textContent='Updating…';const cancel=[...productModal.querySelectorAll('.btn-cancel')];cancel.forEach(button=>button.disabled=true);
  try{const response=await fetch('/api/update-product',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}),data=await response.json();if(!response.ok||!data.success)throw Error(data.error||'Could not update product.');productUpdating=false;closeProductEdit();fetchFilteredProducts();alert(data.message||'Product updated successfully.');}
  catch(error){alert(error.message);}finally{productUpdating=false;productUpdate.disabled=false;productUpdate.textContent='Update';cancel.forEach(button=>button.disabled=false);}
 });

//#region  FORMAT DATE TO DISPLAY DD-MMM-YYYY
              function formatToDdMMMyyyy(dateString) {
                if (!dateString) return "N/A";
                const dateObj = new Date(dateString);
                if (isNaN(dateObj.getTime())) return "N/A";
                const day = String(dateObj.getDate()).padStart(2, "0");
                const yy = String(dateObj.getFullYear()).slice(-2);
                const months = [
                  "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",
                ];
                return (
                  day + "-" + months[dateObj.getMonth()] + "-" + yy
                );
              }
//#endregion ============ END FORMAT DATE TO DISPLAY DD-MMM-YYYY===================================//

}
//#endregion 
//==========================================================================================//    

//=============================PURCHASES=============================================//
//#region 📌 PURCHASES CODE ALL INSERT HERE

function initPurchasesPage() {
  let TotalPurchase = "";

//#region  LOAD PURCHASES FROM DATABASE
              const btnPurchaseSearch = document.getElementById("btn-purchases-search");
              if (!btnPurchaseSearch) return;               
              fetchFilteredPurchases();
//#endregion

//#region  PURCHASES SEARCH BUTTON CLICK EVENT
             btnPurchaseSearch.addEventListener("click", fetchFilteredPurchases);

              //================ SEARCH EVENTS FOR RANGE, STATUS, QUOTATION NUMBER, CUSTOMER NAME ====================//
              document.getElementById("filter-purchases-range").addEventListener("change", (event) => 
                {
                    document.getElementById("filter-purchases-start-date").value = "";
                    document.getElementById("filter-purchases-end-date").value = "";
                    fetchFilteredPurchases();
                });
              document.getElementById("filter-purchases-status").addEventListener("change", (event) => 
                {
                  
                  fetchFilteredPurchases();
                });
              // document.getElementById("search-purchases-no").addEventListener("input", () => 
              //   {
                  
              //     fetchFilteredPurchases();
              //   });
                document.getElementById("search-purchases-bill").addEventListener("input", () => 
                {
                  
                  fetchFilteredPurchases();
                });
              document.getElementById("search-purchases-customer").addEventListener("input", () => 
                {
                  
                  fetchFilteredPurchases();
                });
//#endregion

//#region  FETCH PURCHASES FROM DATABASE FUNCTION
              
              function fetchFilteredPurchases() {
                document.getElementById("purchases-head").textContent = `Purchases Registry`;
                const purchaseloadingOverlay = document.getElementById("purchases-loading-overlay");
                const purchasetableBlock = document.getElementById("purchases-table-display-block");
                const purchasetbody = document.getElementById("purchases-rows");
                
                purchaseloadingOverlay.style.display = "block";
                purchasetableBlock.style.opacity = "0.4";

                const payload = {
                  // PNumber: document.getElementById("search-purchases-no").value.trim(),
                  BillNumber: document.getElementById("search-purchases-bill").value.trim(),
                  searchQuery: document.getElementById("search-purchases-customer").value.trim(),
                  Status: document.getElementById("filter-purchases-status").value,
                  timeRange: document.getElementById("filter-purchases-range").value,
                  startDate: document.getElementById("filter-purchases-start-date").value,
                  endDate: document.getElementById("filter-purchases-end-date").value,
                };
                //console.log("[ERP DEBUG] Credit Notes Data Retrieved:", payload);

                fetch("/api/purchases", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                  
                })
                
                  .then((res) => res.json())
                  .then((data) => { 
                    // console.log("[ERP DEBUG] Credit Notes Data Retrieved:", data.creditnotes);
                    purchasetbody.innerHTML = "";
                    purchaseloadingOverlay.style.display = "none";
                    purchasetableBlock.style.opacity = "1.0";
                    
                    //TotalQuote = data.quotations.length;//total quotations count
                    if (
                      !data.success || !data.purchases || data.purchases.length === 0) {
                      
                      purchasetbody.innerHTML =
                        '<tr><td colspan="13" class="text-center text-muted py-3">No matching purchases records found inside database registry.</td></tr>';
                      return;
                      
                    }
                    TotalPurchase = "";
                    TotalPurchase = data.purchases.length;//total quotations count
                                       // 1. Extract all dates and convert them to timestamps
                    const timestamps = data.purchases.map(purchase => new Date(purchase.BillDate).getTime());
                    // 2. Find the minimum and maximum timestamps
                    const minTimestamp = Math.min(...timestamps);
                    const maxTimestamp = Math.max(...timestamps);                    
                    document.getElementById("purchases-head").innerHTML = `Purchases (${TotalPurchase})`;
                    const now = new Date();
                    document.getElementById("purchases-head-date").innerHTML = formatToDdMMMyyyy(now);
                    // 💡 DYNAMICALLY UPDATE THE DATE PICKERS FOR DELIVERY ORDERS
                    if (data.computedDates.from) {
                        document.getElementById("filter-purchases-start-date").value = data.computedDates.from;
                    } else {
                        document.getElementById("filter-purchases-start-date").value = ""; // Clear if FULL history selection
                    }

                    if (data.computedDates.to) {
                        document.getElementById("filter-purchases-end-date").value = data.computedDates.to;
                    } else {
                        document.getElementById("filter-purchases-end-date").value = ""; // Clear if FULL history selection
                    }
                    data.purchases.forEach((purchase) => {
                      const row = document.createElement("tr");
                      TotalPurchase = purchase.length;//total purchase count
                      // 2. 💡 CRITICAL FIX: Set your data markers directly onto the element object wrapper!
                      row.setAttribute('data-id', purchase.ID || "");
                      row.setAttribute('data-purchase', purchase.PNumber || "");
                      //let badgeClass = "text-danger";
                      let rowTextColorStyle = ""; // 🎯 Holder for row inline color styles
                      // 2. 🎨 MAP ROW TEXT COLOR DIRECTLY TO FINANCIAL REGISTRY STATUSES
                      const purchaseTypeValues = (purchase.Status || "PENDING").toUpperCase();

                      if (purchaseTypeValues === "PAID" || purchaseTypeValues === "Paid") {
                        //badgeClass = "bg-success";
                        rowTextColorStyle = "color: green;"; // green
                      } else if (purchaseTypeValues === "PENDING" || purchaseTypeValues === "Pending") {
                        //badgeClass = "bg-warning text-dark";
                        rowTextColorStyle = "color: red;"; // red
                      } else if (purchaseTypeValues === "PDC") {
                        //badgeClass = "bg-info text-dark";
                        rowTextColorStyle = "color: purple;"; // purple
                       } 
                      else if (
                        purchaseTypeValues === "ADV. PAID" ||
                        purchaseTypeValues === "Adv. Paid"
                      ) {
                        //badgeClass = "bg-danger";
                        rowTextColorStyle = "color: blue;"; //  blue text row
                      }
                      // 3. Inject the style attribute directly into the opening <tr> element node
                      if (rowTextColorStyle) {
                        row.setAttribute("style", rowTextColorStyle);
                      }
                      
                      row.innerHTML = `
                        
                        <td class="col-width-id">${purchase.ID || "N/A"}</td> <!-- 🎯 ADDED CLASS HERE TO HIDE CELL -->
                        <td>${purchase.PNumber || "N/A"}</td>
                        <td>${formatToDdMMMyyyy(purchase.BillDate)}</td>
                        <td>${purchase.BillNumber || "N/A"}</td>
                        <td>${purchase.Company || "CASH"}</td>
                        <td>${purchase.description || "-"}</td>
                        <td style="text-align: right;">${parseFloat(purchase.TotalAmount || 0).toFixed(2)}</td>
                        <td style="text-align: right;">${parseFloat(purchase.Paid || 0).toFixed(2)}</td>
                        <td style="text-align: right;">${parseFloat(purchase.Balance || 0).toFixed(2)}</td>
                        <td>${purchase.Mode || "-"}</td>
                        <td>${formatToDdMMMyyyy(purchase.PaidDate)}</td>
                        <td>${purchase.Status || "PENDING"}</td>
                        <td>${purchase.User_name || "-"}</td>
                        
                    `;
                      purchasetbody.appendChild(row);
                    });
                    
                  })
                  .catch((err) => {
                    console.error("Critical rendering pipeline issue:", err);
                    purchaseloadingOverlay.style.display = "none";
                    purchasetableBlock.style.opacity = "1.0";
                    purchasetbody.innerHTML =
                      '<tr><td colspan="13" class="text-center text-danger py-3">Error streaming dataset values. Check server connection metrics.</td></tr>';
                  });
                  
              }
              // 🎯 GLOBAL STORAGE TRACKER FOR THE ACTIVE SELECTED CREDIT NOTE DATA
              let activeSelectedPurchaseNo = null;
              let activeSelectedPurchaseId = null;
              
//#endregion

//#region  BUTTON PURCHASES RESET CLICK EVENT
              document.getElementById("btn-purchases-reset").addEventListener("click", () => 
                {
                  // document.getElementById("search-purchases-no").value = "";
                  document.getElementById("search-purchases-bill").value = "";
                  document.getElementById("search-purchases-customer").value = "";
                  document.getElementById("filter-purchases-status").value = "ALL";
                  document.getElementById("filter-purchases-range").value = "3MONTH";
                  document.getElementById("filter-purchases-start-date").value = "";
                  document.getElementById("filter-purchases-end-date").value = "";
                  fetchFilteredPurchases();
                });
//#endregion ============ END BUTTON RESET CLICK EVENT ===================================//

//#region  OPEN PURCHASES DYNAMIC CONTEXT MENU
              document.getElementById("purchases-rows").addEventListener("contextmenu", function (e) {
                  const clickedRow = e.target.closest("tr");
                  if (!clickedRow) return;
                  // const cells = clickedRow.getElementsByTagName("td");
                  // if (!cells || cells.length < 13) return; // Ignore loose spaces or empty rows
                  e.preventDefault();
                  // ⚡ INSTANT READ: Bypasses innerText geometry checks completely!
                  activeSelectedPurchaseId = clickedRow.getAttribute("data-id") || "";
                  activeSelectedPurchaseNo = clickedRow.getAttribute("data-purchase") || "";
                  //console.log(`[ERP DEBUG] Fast Lock: ${activeSelectedCreditNoteNo}`);
                  // 🎯 THE FRONTEND FIX: Read InvoiceNo directly out of index cell 1
                  // Index 0 is hidden ID, Index 1 is Invoice Number string
                  // activeSelectedInvoiceId = cells[0].innerText.trim() || cells[0].textContent.trim();
                  // activeSelectedInvoiceNo = cells[1].innerText.trim() || cells[1].textContent.trim();
                  // Clean any trailing tags or line breaks from the invoice number string
                  activeSelectedPurchaseNo = activeSelectedPurchaseNo.replace(/<[^>]*>/g, "").trim();
                  //console.log(`[ERP DEBUG] Fast Lock: ${activeSelectedQuotationNo}`);
                // ⚡ OPTIMIZATION 1: Clear ONLY the single previously highlighted row instead of looping through all rows
                const oldHighlightedRow = document.querySelector("#purchases-rows tr.purchases-rows-highlight-context");
                if (oldHighlightedRow) {
                  oldHighlightedRow.classList.remove("purchases-rows-highlight-context");
                }
                clickedRow.classList.add("purchases-rows-highlight-context");

                const menuElement = document.getElementById("purchases-context-menu");
                // ⚡ OPTIMIZATION 2: Pre-set display styles before reading geometric layout sizes
                menuElement.style.visibility = "hidden"; // Render invisibly first so it takes shape in the DOM
                menuElement.style.display = "block";


                  // Highlight row visually
                  // document.querySelectorAll("#invoice-rows tr").forEach((row) => row.classList.remove("invoices-row-highlight-context"),);
                  // clickedRow.classList.add("invoices-row-highlight-context");

                  //const menuElement = document.getElementById("invoices-context-menu",);
                  
                  // menuElement.style.display = "block";
                  //menuElement.style.left = e.clientX + "px";
                  //menuElement.style.top = e.clientY + "px";
                  // 2. Get your monitor window sizes and menu sizes
                const menuWidth = menuElement.offsetWidth || 150;
                const menuHeight = menuElement.offsetHeight || 120;
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;

                // 3. Calculate ideal X (Horizontal) Position
                // If opening to the right goes off-screen, flip it to open to the left
                let targetX = e.clientX;
                if (e.clientX + menuWidth > windowWidth) {
                  targetX = windowWidth - menuWidth - 10; // 10px safety margin from window edge
                }
                
                // 4. Calculate ideal Y (Vertical) Position
                // If opening downward goes off-screen, flip it to open upward instead!
                let targetY = e.clientY;
                if (e.clientY + menuHeight > windowHeight) {
                  targetY = e.clientY - menuHeight; // Shifts the menu completely above your cursor
                  
                  // Safety check: if it hits the absolute top of the viewport
                  if (targetY < 0) targetY = 10; 
                }
                
                // 5. Apply the safe, un-clipped coordinates
                menuElement.style.left = targetX + "px";
                menuElement.style.top = targetY + "px";
                menuElement.style.visibility = "visible"; 
                e.stopPropagation();
                });

              // 🎯 HIDE MENU SCRIPT: Closes popup if user clicks anywhere else on screen
              document.addEventListener("click", function (e) {
                const menuElement = document.getElementById(
                  "purchases-context-menu",
                );
                if (!e.target.closest("#purchases-context-menu")) {
                  menuElement.style.display = "none";
                  document
                    .querySelectorAll("#purchases-rows tr")
                    .forEach((row) =>
                      row.classList.remove("purchases-rows-highlight-context"),
                    );
                }
              });
//#endregion

//#region  FORMAT DATE TO DISPLAY DD-MMM-YYYY
              function formatToDdMMMyyyy(dateString) {
                if (!dateString) return "N/A";
                const dateObj = new Date(dateString);
                if (isNaN(dateObj.getTime())) return "N/A";
                const day = String(dateObj.getDate()).padStart(2, "0");
                const yy = String(dateObj.getFullYear()).slice(-2);
                const months = [
                  "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",
                ];
                return (
                  day + "-" + months[dateObj.getMonth()] + "-" + yy
                );
              }
//#endregion ============ END FORMAT DATE TO DISPLAY DD-MMM-YYYY===================================//

}

//#endregion 
//==========================================================================================//

//=============================EXPENSES=============================================//
//#region 📌 EXPENSES CODE ALL INSERT HERE

function initExpensesPage() {
  let TotalExpense = "";

//#region  LOAD EXPENSES FROM DATABASE
              const btnExpenseSearch = document.getElementById("btn-expenses-search");
              if (!btnExpenseSearch) return;               
              fetchFilteredExpenses();
//#endregion

//#region  EXPENSES SEARCH BUTTON CLICK EVENT
             btnExpenseSearch.addEventListener("click", fetchFilteredExpenses);

              //================ SEARCH EVENTS FOR RANGE, STATUS, QUOTATION NUMBER, CUSTOMER NAME ====================//
              document.getElementById("filter-expenses-range").addEventListener("change", (event) => 
                {
                    document.getElementById("filter-expenses-start-date").value = "";
                    document.getElementById("filter-expenses-end-date").value = "";
                    fetchFilteredExpenses();
                });
              document.getElementById("filter-expenses-status").addEventListener("change", (event) => 
                {
                  
                  fetchFilteredExpenses();
                });
              document.getElementById("search-expenses-no").addEventListener("input", () => 
                {
                  
                  fetchFilteredExpenses();
                });
                // document.getElementById("search-expenses-bill").addEventListener("input", () => 
                // {
                  
                //   fetchFilteredExpenses();
                // });
              // document.getElementById("search-expenses-customer").addEventListener("input", () => 
              //   {
                  
              //     fetchFilteredExpenses();
              //   });
//#endregion

//#region  FETCH PURCHASES FROM DATABASE FUNCTION
              
              function fetchFilteredExpenses() {
                document.getElementById("expenses-head").textContent = `Expenses Registry`;
                const expensesloadingOverlay = document.getElementById("expenses-loading-overlay");
                const expensetableBlock = document.getElementById("expenses-table-display-block");
                const expensetbody = document.getElementById("expenses-rows");
                
                expensesloadingOverlay.style.display = "block";
                expensetableBlock.style.opacity = "0.4";

                const payload = {
                  searchQuery: document.getElementById("search-expenses-no").value.trim(),
                  // BillNumber: document.getElementById("search-expenses-bill").value.trim(),
                  // Company: document.getElementById("search-expenses-customer").value.trim(),
                  Status: document.getElementById("filter-expenses-status").value,
                  timeRange: document.getElementById("filter-expenses-range").value,
                  startDate: document.getElementById("filter-expenses-start-date").value,
                  endDate: document.getElementById("filter-expenses-end-date").value,
                };
                //console.log("[ERP DEBUG] Credit Notes Data Retrieved:", payload);

                fetch("/api/expenses", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                  
                })
                
                  .then((res) => res.json())
                  .then((data) => { 
                    //console.log("[ERP DEBUG] Credit Notes Data Retrieved:", data.expenses);
                    expensetbody.innerHTML = "";
                    expensesloadingOverlay.style.display = "none";
                    expensetableBlock.style.opacity = "1.0";
                    
                    //TotalQuote = data.quotations.length;//total quotations count
                    if (
                      !data.success || !data.expenses || data.expenses.length === 0) {
                      
                      expensetbody.innerHTML =
                        '<tr><td colspan="13" class="text-center text-muted py-3">No matching expenses records found inside database registry.</td></tr>';
                      return;
                      
                    }
                    TotalExpense = "";
                    TotalExpense = data.expenses.length;//total expense count
                                       // 1. Extract all dates and convert them to timestamps
                    const timestamps = data.expenses.map(expense => new Date(expense.ExpDate).getTime());
                    // 2. Find the minimum and maximum timestamps
                    const minTimestamp = Math.min(...timestamps);
                    const maxTimestamp = Math.max(...timestamps);                    
                    document.getElementById("expenses-head").innerHTML = `Expenses (${TotalExpense})`;
                    const now = new Date();
                    document.getElementById("expenses-head-date").innerHTML = formatToDdMMMyyyy(now);
                    // 💡 DYNAMICALLY UPDATE THE DATE PICKERS FOR DELIVERY ORDERS
                    if (data.computedDates.from) {
                        document.getElementById("filter-expenses-start-date").value = data.computedDates.from;
                    } else {
                        document.getElementById("filter-expenses-start-date").value = ""; // Clear if FULL history selection
                    }

                    if (data.computedDates.to) {
                        document.getElementById("filter-expenses-end-date").value = data.computedDates.to;
                    } else {
                        document.getElementById("filter-expenses-end-date").value = ""; // Clear if FULL history selection
                    }
                    

                    data.expenses.forEach((expense) => {
                      const row = document.createElement("tr");
                      TotalExpense = expense.length;//total purchase count
                      // 2. 💡 CRITICAL FIX: Set your data markers directly onto the element object wrapper!
                      row.setAttribute('data-id', expense.ID || "");
                      row.setAttribute('data-expense', expense.ExpNumber || "");
                      //let badgeClass = "text-danger";
                      let rowTextColorStyle = ""; // 🎯 Holder for row inline color styles
                      // 2. 🎨 MAP ROW TEXT COLOR DIRECTLY TO FINANCIAL REGISTRY STATUSES
                      const expenseTypeValues = (expense.Status || "PENDING").toUpperCase();

                      if (expenseTypeValues === "PAID" || expenseTypeValues === "Paid") {
                        //badgeClass = "bg-success";
                        rowTextColorStyle = "color: green;"; // green
                      } else if (expenseTypeValues === "PENDING" || expenseTypeValues === "Pending") {
                        //badgeClass = "bg-warning text-dark";
                        rowTextColorStyle = "color: red;"; // red
                      } else if (expenseTypeValues === "PDC") {
                        //badgeClass = "bg-info text-dark";
                        rowTextColorStyle = "color: purple;"; // purple
                       } 
                      else if (
                        expenseTypeValues === "ADV. PAID" ||
                        expenseTypeValues === "Adv. Paid"
                      ) {
                        //badgeClass = "bg-danger";
                        rowTextColorStyle = "color: blue;"; //  blue text row
                      }
                      // 3. Inject the style attribute directly into the opening <tr> element node
                      if (rowTextColorStyle) {
                        row.setAttribute("style", rowTextColorStyle);
                      }
                      
                      row.innerHTML = `
                        
                        <td class="col-width-id">${expense.ID || "N/A"}</td> <!-- 🎯 ADDED CLASS HERE TO HIDE CELL -->
                        <td>${expense.ExpNumber || "N/A"}</td>
                        <td>${formatToDdMMMyyyy(expense.ExpDate)}</td>
                        <td>${expense.Type || "-"}</td>
                        <td>${expense.Notes || "-"}</td>
                        <td>${parseFloat(expense.Amount || 0).toFixed(2)}</td>
                        <td>${parseFloat(expense.Paid || 0).toFixed(2)}</td>
                        <td>${parseFloat(expense.Balance || 0).toFixed(2)}</td>
                        <td>${formatToDdMMMyyyy(expense.PaidDate)}</td>
                        <td>${expense.Mode || "CREDIT"}</td>
                        <td>${expense.Status || "PENDING"}</td>
                        <td>${expense.User_name || "-"}</td>
                        
                    `;
                      expensetbody.appendChild(row);
                    });
                    
                  })
                  .catch((err) => {
                    console.error("Critical rendering pipeline issue:", err);
                    expensesloadingOverlay.style.display = "none";
                    expensetableBlock.style.opacity = "1.0";
                    expensetbody.innerHTML =
                      '<tr><td colspan="13" class="text-center text-danger py-3">Error streaming dataset values. Check server connection metrics.</td></tr>';
                  });
                  
              }
              // 🎯 GLOBAL STORAGE TRACKER FOR THE ACTIVE SELECTED CREDIT NOTE DATA
              let activeSelectedExpenseNo = null;
              let activeSelectedExpenseId = null;
              
//#endregion

//#region  BUTTON PURCHASES RESET CLICK EVENT
              document.getElementById("btn-expenses-reset").addEventListener("click", () => 
                {
                  document.getElementById("search-expenses-no").value = "";
                  // document.getElementById("search-expenses-bill").value = "";
                  // document.getElementById("search-expenses-customer").value = "";
                  document.getElementById("filter-expenses-status").value = "ALL";
                  document.getElementById("filter-expenses-range").value = "3MONTH";
                  document.getElementById("filter-expenses-start-date").value = "";
                  document.getElementById("filter-expenses-end-date").value = "";
                  fetchFilteredExpenses();
                });
//#endregion ============ END BUTTON RESET CLICK EVENT ===================================//

//#region  OPEN PURCHASES DYNAMIC CONTEXT MENU
              document.getElementById("expenses-rows").addEventListener("contextmenu", function (e) {
                  const clickedRow = e.target.closest("tr");
                  if (!clickedRow) return;
                  // const cells = clickedRow.getElementsByTagName("td");
                  // if (!cells || cells.length < 13) return; // Ignore loose spaces or empty rows
                  e.preventDefault();
                  // ⚡ INSTANT READ: Bypasses innerText geometry checks completely!
                  activeSelectedExpenseId = clickedRow.getAttribute("data-id") || "";
                  activeSelectedExpenseNo = clickedRow.getAttribute("data-expense") || "";
                  //console.log(`[ERP DEBUG] Fast Lock: ${activeSelectedCreditNoteNo}`);
                  // 🎯 THE FRONTEND FIX: Read InvoiceNo directly out of index cell 1
                  // Index 0 is hidden ID, Index 1 is Invoice Number string
                  // activeSelectedInvoiceId = cells[0].innerText.trim() || cells[0].textContent.trim();
                  // activeSelectedInvoiceNo = cells[1].innerText.trim() || cells[1].textContent.trim();
                  // Clean any trailing tags or line breaks from the invoice number string
                  activeSelectedExpenseNo = activeSelectedExpenseNo.replace(/<[^>]*>/g, "").trim();
                  //console.log(`[ERP DEBUG] Fast Lock: ${activeSelectedQuotationNo}`);
                // ⚡ OPTIMIZATION 1: Clear ONLY the single previously highlighted row instead of looping through all rows
                const oldHighlightedRow = document.querySelector("#expenses-rows tr.expenses-rows-highlight-context");
                if (oldHighlightedRow) {
                  oldHighlightedRow.classList.remove("expenses-rows-highlight-context");
                }
                clickedRow.classList.add("expenses-rows-highlight-context");

                const menuElement = document.getElementById("expenses-context-menu");
                // ⚡ OPTIMIZATION 2: Pre-set display styles before reading geometric layout sizes
                menuElement.style.visibility = "hidden"; // Render invisibly first so it takes shape in the DOM
                menuElement.style.display = "block";


                  // Highlight row visually
                  // document.querySelectorAll("#invoice-rows tr").forEach((row) => row.classList.remove("invoices-row-highlight-context"),);
                  // clickedRow.classList.add("invoices-row-highlight-context");

                  //const menuElement = document.getElementById("invoices-context-menu",);
                  
                  // menuElement.style.display = "block";
                  //menuElement.style.left = e.clientX + "px";
                  //menuElement.style.top = e.clientY + "px";
                  // 2. Get your monitor window sizes and menu sizes
                const menuWidth = menuElement.offsetWidth || 150;
                const menuHeight = menuElement.offsetHeight || 120;
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;

                // 3. Calculate ideal X (Horizontal) Position
                // If opening to the right goes off-screen, flip it to open to the left
                let targetX = e.clientX;
                if (e.clientX + menuWidth > windowWidth) {
                  targetX = windowWidth - menuWidth - 10; // 10px safety margin from window edge
                }
                
                // 4. Calculate ideal Y (Vertical) Position
                // If opening downward goes off-screen, flip it to open upward instead!
                let targetY = e.clientY;
                if (e.clientY + menuHeight > windowHeight) {
                  targetY = e.clientY - menuHeight; // Shifts the menu completely above your cursor
                  
                  // Safety check: if it hits the absolute top of the viewport
                  if (targetY < 0) targetY = 10; 
                }
                
                // 5. Apply the safe, un-clipped coordinates
                menuElement.style.left = targetX + "px";
                menuElement.style.top = targetY + "px";
                menuElement.style.visibility = "visible"; 
                e.stopPropagation();
                });

              // 🎯 HIDE MENU SCRIPT: Closes popup if user clicks anywhere else on screen
              document.addEventListener("click", function (e) {
                const menuElement = document.getElementById(
                  "expenses-context-menu",
                );
                if (!e.target.closest("#expenses-context-menu")) {
                  menuElement.style.display = "none";
                  document
                    .querySelectorAll("#expenses-rows tr")
                    .forEach((row) =>
                      row.classList.remove("expenses-rows-highlight-context"),
                    );
                }
              });
//#endregion

//#region  FORMAT DATE TO DISPLAY DD-MMM-YYYY
              function formatToDdMMMyyyy(dateString) {
                if (!dateString) return "N/A";
                const dateObj = new Date(dateString);
                if (isNaN(dateObj.getTime())) return "N/A";
                const day = String(dateObj.getDate()).padStart(2, "0");
                const yy = String(dateObj.getFullYear()).slice(-2);
                const months = [
                  "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",
                ];
                return (
                  day + "-" + months[dateObj.getMonth()] + "-" + yy
                );
              }
//#endregion ============ END FORMAT DATE TO DISPLAY DD-MMM-YYYY===================================//

}

//#endregion 
//==========================================================================================//


        

 


// Responsive Edit Invoice layout; reuse existing controls and event handlers.
(() => {
  function initializeEditInvoiceLayout() {
    const modal = document.getElementById('editinv-modal-overlay');
    const form = document.getElementById('edit-invoice-master-form');
    if (!modal || !form || form.dataset.responsiveLayoutReady) return;
    form.dataset.responsiveLayoutReady = 'true';
    modal.firstElementChild?.firstElementChild?.classList.add('mobile-entry-head');
    const heading = document.getElementById('edit-modal-title');
    if (heading) heading.dataset.mobileTitle = 'Edit Invoice';
    const rows = Array.from(form.children).filter(el => el.tagName === 'DIV');
    const titles = ['Customer details', 'Contact Details', 'Add an item', 'Item totals, notes & costs'];
    rows.slice(0, 4).forEach((row, index) => {
      row.classList.add('invoice-mobile-section', 'invoice-mobile-section-closed');
      row.id ||= 'edit-invoice-section-' + index;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'invoice-mobile-section-toggle';
      button.textContent = titles[index];
      button.setAttribute('aria-controls', row.id);
      button.setAttribute('aria-expanded', 'false');
      button.addEventListener('click', () => {
        const open = row.classList.contains('invoice-mobile-section-closed');
        row.classList.toggle('invoice-mobile-section-closed', !open);
        button.setAttribute('aria-expanded', String(open));
      });
      row.before(button);
    });
    const totals = rows.find(row => row.querySelector('#edit-grand-total'));
    const table = rows.find(row => row.querySelector('#invoice-table'));
    table?.classList.add('invoice-mobile-table-section');
    if (totals) {
      totals.classList.add('invoice-mobile-totals');
      ['edit-pid', 'edit-o-stock', 'edit-a-stock', 'edit-amount-in-words'].forEach(id => document.getElementById(id)?.parentElement.classList.add('invoice-mobile-stock-field'));
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'invoice-mobile-stock-toggle';
      button.textContent = 'Stock & amount in words';
      button.setAttribute('aria-expanded', 'false');
      button.addEventListener('click', () => button.setAttribute('aria-expanded', String(totals.classList.toggle('invoice-mobile-stock-open'))));
      totals.prepend(button);
    }
    const number = document.getElementById('edit-invoice-number')?.parentElement;
    const words = document.getElementById('edit-amount-in-words')?.parentElement;
    if (number && words) {
      const anchor = document.createComment('Edit Invoice number mobile position');
      number.before(anchor);
      const desktop = matchMedia('(min-width: 768px)');
      const place = () => desktop.matches ? words.before(number) : anchor.after(number);
      desktop.addEventListener('change', place); place();
    }
    form.addEventListener('invalid', event => {
      const section = event.target.closest('.invoice-mobile-section');
      if (section) { section.classList.remove('invoice-mobile-section-closed'); section.previousElementSibling?.setAttribute('aria-expanded', 'true'); }
    }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeEditInvoiceLayout);
  else initializeEditInvoiceLayout();
})();

// Keep the Edit Invoice item editor inside the visible mobile browser viewport.

(() => {
  function initializeItemViewport() {
    const modal = document.getElementById('invitems-modal-overlay');
    if (!modal) return;
    const viewport = window.visualViewport;
    let pending = 0;
    function update() {
      pending = 0;
      modal.style.setProperty('--item-visible-height', (viewport ? viewport.height : innerHeight) + 'px');
      modal.style.setProperty('--item-visible-top', (viewport ? viewport.offsetTop : 0) + 'px');
    }
    function schedule() { if (!pending) pending = requestAnimationFrame(update); }
    viewport?.addEventListener('resize', schedule);
    viewport?.addEventListener('scroll', schedule);
    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', schedule);
    new MutationObserver(schedule).observe(modal, { attributes: true, attributeFilter: ['class'] });
    update();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeItemViewport);
  else initializeItemViewport();
})();

// Fit PDC Clear to the mobile browser visible viewport.


(() => {
  function initializeItemViewport() {
    const modal = document.getElementById('pdcclear-modal-overlay');
    if (!modal) return;
    const viewport = window.visualViewport;
    let pending = 0;
    function update() {
      pending = 0;
      modal.style.setProperty('--item-visible-height', (viewport ? viewport.height : innerHeight) + 'px');
      modal.style.setProperty('--item-visible-top', (viewport ? viewport.offsetTop : 0) + 'px');
    }
    function schedule() { if (!pending) pending = requestAnimationFrame(update); }
    viewport?.addEventListener('resize', schedule);
    viewport?.addEventListener('scroll', schedule);
    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', schedule);
    new MutationObserver(schedule).observe(modal, { attributes: true, attributeFilter: ['class'] });
    update();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeItemViewport);
  else initializeItemViewport();
})();

// Fit Delivery Note to the mobile browser visible viewport.



(() => {
  function initializeItemViewport() {
    const modal = document.getElementById('do-modal-overlay');
    if (!modal) return;
    const viewport = window.visualViewport;
    let pending = 0;
    function update() {
      pending = 0;
      modal.style.setProperty('--item-visible-height', (viewport ? viewport.height : innerHeight) + 'px');
      modal.style.setProperty('--item-visible-top', (viewport ? viewport.offsetTop : 0) + 'px');
    }
    function schedule() { if (!pending) pending = requestAnimationFrame(update); }
    viewport?.addEventListener('resize', schedule);
    viewport?.addEventListener('scroll', schedule);
    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', schedule);
    new MutationObserver(schedule).observe(modal, { attributes: true, attributeFilter: ['class'] });
    update();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeItemViewport);
  else initializeItemViewport();
})();

// Collapsible Delivery Note input sections; desktop fields remain visible.
(() => {
  function setupDeliverySections() {
    const form = document.getElementById('do-invoice-master-form');
    if (!form || form.dataset.mobileSectionsReady) return;
    form.dataset.mobileSectionsReady = 'true';
    const rows = Array.from(form.children).filter(el => el.tagName === 'DIV' && !el.querySelector('#do-table'));
    const titles = ['Customer details', 'Invoice Details', 'Contact Details', 'Notes & our contact'];
    rows.forEach((row, index) => {
      row.classList.add('do-mobile-details', 'invoice-mobile-section-closed');
      row.id ||= 'do-mobile-section-' + index;
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'invoice-mobile-section-toggle';
      button.textContent = titles[index] || 'Additional details';
      button.setAttribute('aria-controls', row.id); button.setAttribute('aria-expanded', 'false');
      button.addEventListener('click', () => button.setAttribute('aria-expanded', String(!row.classList.toggle('invoice-mobile-section-closed'))));
      row.before(button);
    });
    form.addEventListener('invalid', event => {
      const row = event.target.closest('.do-mobile-details');
      if (row) { row.classList.remove('invoice-mobile-section-closed'); row.previousElementSibling?.setAttribute('aria-expanded', 'true'); }
    }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupDeliverySections);
  else setupDeliverySections();
})();

// Fit Multi Payment to the mobile browser's visible viewport.
(() => {
  function setupMultiPaymentViewport() {
    const modal = document.getElementById('multipayment-modal-overlay');
    if (!modal) return;
    const viewport = window.visualViewport;
    let pending = 0;
    function update() {
      pending = 0;
      modal.style.setProperty('--item-visible-height', (viewport?.height ?? innerHeight) + 'px');
      modal.style.setProperty('--item-visible-top', (viewport?.offsetTop ?? 0) + 'px');
    }
    function schedule() { if (!pending) pending = requestAnimationFrame(update); }
    viewport?.addEventListener('resize', schedule);
    viewport?.addEventListener('scroll', schedule);
    window.addEventListener('resize', schedule);
    update();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupMultiPaymentViewport);
  else setupMultiPaymentViewport();
})();

// Fit Single Payment to the mobile browser's visible viewport.
(() => {
  function setupSinglePaymentViewport() {
    const modal = document.getElementById('payment-modal-overlay');
    if (!modal) return;
    const viewport = window.visualViewport;
    let pending = 0;
    function update() {
      pending = 0;
      modal.style.setProperty('--item-visible-height', (viewport?.height ?? innerHeight) + 'px');
      modal.style.setProperty('--item-visible-top', (viewport?.offsetTop ?? 0) + 'px');
    }
    function schedule() { if (!pending) pending = requestAnimationFrame(update); }
    viewport?.addEventListener('resize', schedule);
    viewport?.addEventListener('scroll', schedule);
    window.addEventListener('resize', schedule);
    update();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupSinglePaymentViewport);
  else setupSinglePaymentViewport();
})();

// Fit Receipt to the mobile browser's visible viewport.
(() => {
  function setupReceiptViewport() {
    const modal = document.getElementById('receipt-modal-overlay');
    if (!modal) return;
    const viewport = window.visualViewport;
    let pending = 0;
    function update() {
      pending = 0;
      modal.style.setProperty('--item-visible-height', (viewport?.height ?? innerHeight) + 'px');
      modal.style.setProperty('--item-visible-top', (viewport?.offsetTop ?? 0) + 'px');
    }
    function schedule() { if (!pending) pending = requestAnimationFrame(update); }
    viewport?.addEventListener('resize', schedule);
    viewport?.addEventListener('scroll', schedule);
    window.addEventListener('resize', schedule);
    update();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupReceiptViewport);
  else setupReceiptViewport();
})();

// Fit Multi Receipt to the mobile browser's visible viewport.
(() => {
  function setupMultiReceiptViewport() {
    const modal = document.getElementById('multireceipt-modal-overlay');
    if (!modal) return;
    const viewport = window.visualViewport;
    let pending = 0;
    function update() {
      pending = 0;
      modal.style.setProperty('--item-visible-height', (viewport?.height ?? innerHeight) + 'px');
      modal.style.setProperty('--item-visible-top', (viewport?.offsetTop ?? 0) + 'px');
    }
    function schedule() { if (!pending) pending = requestAnimationFrame(update); }
    viewport?.addEventListener('resize', schedule);
    viewport?.addEventListener('scroll', schedule);
    window.addEventListener('resize', schedule);
    update();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupMultiReceiptViewport);
  else setupMultiReceiptViewport();
})();

// Keep the selected invoice count beside the receipt payment details.
(() => {
  function positionReceiptCount() {
    const count = document.getElementById('multireceipt-count')?.parentElement;
    const chequeDate = document.getElementById('multireceipt-chq-date')?.parentElement;
    if (count && chequeDate) chequeDate.after(count);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', positionReceiptCount);
  else positionReceiptCount();
})();

// Fit Statement to the mobile browser's visible viewport.
(() => {
  function setupStatementViewport() {
    const modal = document.getElementById('statement-modal-overlay');
    if (!modal) return;
    const viewport = window.visualViewport;
    let pending = 0;
    function update() {
      pending = 0;
      modal.style.setProperty('--item-visible-height', (viewport?.height ?? innerHeight) + 'px');
      modal.style.setProperty('--item-visible-top', (viewport?.offsetTop ?? 0) + 'px');
    }
    function schedule() { if (!pending) pending = requestAnimationFrame(update); }
    viewport?.addEventListener('resize', schedule);
    viewport?.addEventListener('scroll', schedule);
    window.addEventListener('resize', schedule);
    update();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupStatementViewport);
  else setupStatementViewport();
})();

// Consistent current-date label on all main ledger heading rows.
(() => {
  function initializeLedgerHeadingDate() {
    const group = document.querySelector('.invoice-toolbar .invoice-title-group');
    if (!group) return;
    const heading = group.querySelector('h3[id$="-head"]');
    if (!heading) return;
    const dateId = heading.id + '-date';
    let label = document.getElementById(dateId);
    if (!label) {
      const wrapper = document.createElement('div');
      label = document.createElement('h3');
      label.id = dateId;
      wrapper.appendChild(label);
      group.appendChild(wrapper);
    }
    function refreshDate() {
      const now = new Date();
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      label.textContent = String(now.getDate()).padStart(2, '0') + '-' + months[now.getMonth()] + '-' + String(now.getFullYear()).slice(-2);
    }
    refreshDate();
    window.addEventListener('focus', refreshDate);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeLedgerHeadingDate);
  else initializeLedgerHeadingDate();
})();

// Shared save/update waiting indicator for this page (index and ledger pages).
(function installWriteWaitingIndicator() {
  if(window.__erpWriteWaitInstalled || typeof window.fetch!=='function')return;
  window.__erpWriteWaitInstalled=true;
  const nativeFetch=window.fetch.bind(window);
  let pending=0,overlay=null,label=null,previousBusy=null;
  function begin(message){
    if(!overlay){
      const style=document.createElement('style');
      style.textContent='@keyframes erp-save-spin{to{transform:rotate(360deg)}}.erp-write-wait{position:fixed;inset:0;z-index:2147483647;background:rgba(20,30,50,.4);display:flex;align-items:center;justify-content:center;cursor:wait}.erp-write-wait[hidden]{display:none}.erp-write-wait-box{display:flex;align-items:center;gap:12px;padding:20px 26px;border-radius:12px;background:#fff;color:#203556;box-shadow:0 12px 50px #0003;font:600 14px/1.4 "Segoe UI",sans-serif}.erp-write-wait-spinner{width:26px;height:26px;border:3px solid #dce4f0;border-top-color:#630181;border-radius:50%;animation:erp-save-spin .8s linear infinite}';
      document.head.appendChild(style);
      overlay=document.createElement('div');overlay.className='erp-write-wait';overlay.hidden=true;
      overlay.setAttribute('role','status');overlay.setAttribute('aria-live','polite');
      const box=document.createElement('div');box.className='erp-write-wait-box';
      const spinner=document.createElement('span');spinner.className='erp-write-wait-spinner';spinner.setAttribute('aria-hidden','true');
      label=document.createElement('span');box.append(spinner,label);overlay.appendChild(box);document.body.appendChild(overlay);
    }
    if(pending===0)previousBusy=document.body.getAttribute('aria-busy');
    pending++;label.textContent=message;overlay.hidden=false;document.body.setAttribute('aria-busy','true');
  }
  function finish(){
    pending=Math.max(0,pending-1);
    if(!pending){overlay.hidden=true;if(previousBusy===null)document.body.removeAttribute('aria-busy');else document.body.setAttribute('aria-busy',previousBusy);}
  }
  // Capture repeated mouse/touch/keyboard activation before existing handlers run.
  document.addEventListener('click',event=>{if(pending){event.preventDefault();event.stopImmediatePropagation();}},true);
  document.addEventListener('keydown',event=>{if(pending&&['Enter',' ','Escape'].includes(event.key)){event.preventDefault();event.stopImmediatePropagation();}},true);
  window.fetch=async function(input,options){
    const url=typeof input==='string'?input:input?.url||String(input);
    const method=String(options?.method||input?.method||'GET').toUpperCase();
    const write=['POST','PUT','PATCH'].includes(method)&&/\/api\/(?:save|update)[^/?]*/i.test(url);
    if(!write)return nativeFetch(input,options);
    begin(/\/api\/update/i.test(url)?'Updating… Please wait.':'Saving… Please wait.');
    try{
      const response=await nativeFetch(input,options);
      // Keep the overlay until the full JSON response has arrived, not just headers.
      await response.clone().arrayBuffer();
      return response;
    }finally{finish();}
  };
})();

// Shared modal autocomplete keyboard navigation (customer, product and product code).
(function installModalAutocompleteKeys(){
 if(window.__erpAutocompleteKeysInstalled)return;window.__erpAutocompleteKeysInstalled=true;
 const pairs=[['global-customer','.global-autocomplete-results'],['global-products','.global-product-autocomplete-results'],['global-item-code','.global-item-code-autocomplete-results']];
 const states=new WeakMap();let serial=0;
 function getState(input){
  const pair=pairs.find(([name])=>input.classList?.contains(name));if(!pair)return null;
  const modal=input.closest('.global-modal');const list=modal?.querySelector(pair[1]);if(!list)return null;
  let state=states.get(input);if(state?.list===list)return state;
  state={input,list,index:-1};states.set(input,state);
  if(!list.id)list.id='erp-autocomplete-'+(++serial);
  input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-controls',list.id);input.setAttribute('aria-expanded','false');list.setAttribute('role','listbox');
  function update(){
   const open=!list.classList.contains('d-none')&&list.children.length>0;
   input.setAttribute('aria-expanded',String(open));
   [...list.children].forEach((row,i)=>{row.id=list.id+'-option-'+i;row.setAttribute('role','option');row.setAttribute('aria-selected',String(i===state.index));});
   if(!open){state.index=-1;input.removeAttribute('aria-activedescendant');}
  }
  new MutationObserver(update).observe(list,{childList:true,attributes:true,attributeFilter:['class']});update();
  return state;
 }
 function reset(state){state.index=-1;state.input.removeAttribute('aria-activedescendant');[...state.list.children].forEach(row=>{row.classList.remove('erp-suggestion-active');row.setAttribute('aria-selected','false');});}
 document.addEventListener('focusin',event=>getState(event.target));
 document.addEventListener('input',event=>{const state=getState(event.target);if(state)reset(state);},true);
 document.addEventListener('keydown',event=>{
  const state=getState(event.target);if(!state||event.isComposing)return;
  const {input,list}=state,rows=[...list.children].filter(row=>!row.hidden&&row.getAttribute('aria-disabled')!=='true');
  if(list.classList.contains('d-none')||!rows.length)return;
  if(event.key==='Tab'){list.classList.add('d-none');reset(state);return;}
  if(!['ArrowDown','ArrowUp','Enter','Escape'].includes(event.key))return;
  if(event.key==='Enter'&&state.index<0)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(event.key==='Escape'){list.classList.add('d-none');reset(state);return;}
  if(event.key==='Enter'){rows[state.index]?.click();list.classList.add('d-none');reset(state);input.focus();return;}
  state.index=state.index<0?(event.key==='ArrowDown'?0:rows.length-1):(state.index+(event.key==='ArrowDown'?1:-1)+rows.length)%rows.length;
  rows.forEach((row,i)=>{row.classList.toggle('erp-suggestion-active',i===state.index);row.setAttribute('aria-selected',String(i===state.index));});
  const row=rows[state.index];input.setAttribute('aria-activedescendant',row.id);
  // Scroll only the suggestions, never the enclosing modal or document.
  const rowTop=row.getBoundingClientRect().top-list.getBoundingClientRect().top+list.scrollTop;
  if(rowTop<list.scrollTop)list.scrollTop=rowTop;else if(rowTop+row.offsetHeight>list.scrollTop+list.clientHeight)list.scrollTop=rowTop+row.offsetHeight-list.clientHeight;
 },true);
})();

// Compact New Customer combos float outside the dialog clipping boundary.
(function(){function initCustomerCombos(){
 const modal=document.getElementById('newcust-modal-overlay');if(!modal)return;
 let active=null;
 const combos=[...modal.querySelectorAll('.custom-combobox1,.custom-combobox2,.custom-combobox3')].map(wrapper=>({wrapper,input:wrapper.querySelector('input'),list:wrapper.querySelector('.dropdown-list')})).filter(c=>c.input&&c.list);
 function closeCombo(){if(!active)return;active.list.style.display='none';active.input.setAttribute('aria-expanded','false');active.wrapper.appendChild(active.list);active=null;}
 function positionCombo(){
  if(!active)return;const rect=active.input.getBoundingClientRect(),v=window.visualViewport,top=v?.offsetTop??0,bottom=top+(v?.height??innerHeight),below=bottom-rect.bottom-8,above=rect.top-top-8,up=below<140&&above>below;
  const height=Math.max(32,Math.min(240,up?above:below));
  Object.assign(active.list.style,{position:'fixed',left:Math.max(4,rect.left)+'px',right:'auto',width:Math.min(Math.max(rect.width,190),innerWidth-rect.left-8)+'px',maxHeight:height+'px',overflowY:'auto',zIndex:'1000002',margin:'0'});
  active.list.style.top=(up?Math.max(top+4,rect.top-Math.min(height,active.list.scrollHeight)-3):rect.bottom+3)+'px';
 }
 for(const combo of combos){
  combo.input.setAttribute('aria-expanded','false');
  combo.input.addEventListener('focus',()=>{closeCombo();active=combo;[...combo.list.children].forEach(item=>item.style.display='');document.body.appendChild(combo.list);combo.list.style.display='block';combo.input.setAttribute('aria-expanded','true');positionCombo();});
  combo.input.addEventListener('input',()=>{const q=combo.input.value.toLowerCase();[...combo.list.children].forEach(item=>item.style.display=item.textContent.toLowerCase().includes(q)?'block':'none');positionCombo();});
  combo.list.addEventListener('click',event=>{const item=event.target.closest('li');if(!item)return;combo.input.value=item.textContent.trim();closeCombo();});
  combo.input.addEventListener('keydown',event=>{if(event.key==='Escape'||event.key==='Tab')closeCombo();});
 }
 document.addEventListener('pointerdown',event=>{if(active&&event.target!==active.input&&!active.list.contains(event.target))closeCombo();});
 document.addEventListener('scroll',event=>{if(active&&event.target!==active.list)positionCombo();},true);window.addEventListener('resize',positionCombo);window.visualViewport?.addEventListener('resize',positionCombo);
 new MutationObserver(()=>{if(modal.style.display==='none')closeCombo();}).observe(modal,{attributes:true,attributeFilter:['style']});
}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initCustomerCombos);else initCustomerCombos();})();

