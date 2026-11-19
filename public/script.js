

//#region 📌📌 CATCH INBOUND TOOL TIP MESSAGES FROM IFRAME
window.addEventListener('message', function(event) {
    const tooltip = document.getElementById('iframeCrossTooltip');
    const iframeElement = document.querySelector('iframe[src*="dashboard.html"]') || document.querySelector('iframe');
    
    if (!tooltip || !iframeElement) return;

    if (event.data.action === 'showTooltip') {
        // Uses innerHTML to render the embedded vector paths safely
        tooltip.innerHTML = event.data.html;
        tooltip.style.opacity = '1';
    } 
    else if (event.data.action === 'moveTooltip') {
        const iframeRect = iframeElement.getBoundingClientRect();
        
        const absoluteX = event.data.clientX + iframeRect.left;
        const absoluteY = event.data.clientY + iframeRect.top - 15; 

        tooltip.style.left = absoluteX + 'px';
        tooltip.style.top = absoluteY + 'px';
    } 
    else if (event.data.action === 'hideTooltip') {
        tooltip.style.opacity = '0';
    }
});
//#endregion

//#region 📌📌 FORMAT DATE TO DISPLAY DD-MMM-YYYY
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

//#region 📌📌 NUMBER TO WORDS ==================//
const toWordsConfig = new ToWords({
    localeCode: "en-IN", // Using English locale as base
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
  
  //#endregion


//#region 📌📌 INDEX HTML PAGE CODES ===========//

//#region === COLLAPSE SIDE BAR - INDEX.HTML  ======================//
const sidebar = document.getElementById('sidebar-pane');
const sidebarToggle = document.getElementById('toggle-sidebar-btn');
const NewnavButtons = document.querySelectorAll('.nav-btn');

// 1. Sidebar Main Collapse Toggle (Hamburger Menu)
sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
  
  // Close submenus when explicitly collapsing the sidebar
  if (sidebar.classList.contains('collapsed')) {
    closeAllSubMenus();
  }
});

// 2. Auto-Expand and Open Sub-Menu on Icon Click
NewnavButtons.forEach(button => {
  button.addEventListener('click', () => {
    
    // If collapsed, expand it first, then continue executing the code below
    if (sidebar.classList.contains('collapsed')) {
      sidebar.classList.remove('collapsed');
    }

    // This runs immediately, opening the submenu as the sidebar grows
    const targetId = button.getAttribute('data-target');
    const targetMenu = document.getElementById(targetId);
    const arrow = button.querySelector('.arrow-indicator');
    
    if (targetMenu) {
      const isOpen = targetMenu.classList.toggle('open');
      
      // Update your arrow direction indicator
      if (arrow) {
        arrow.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
      }
    }
  });
});

// Helper function to close all submenus
function closeAllSubMenus() {
  document.querySelectorAll('.sub-menu-container').forEach(menu => {
    menu.classList.remove('open');
  });
}


//#endregion==========================================================================//

//#region === SET ACTIVE SIDEBAR ITEM WHEN CLOSING A MODAL  ======================//
function setActiveSidebarItem(targetHref) {
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

//#region === NAVIGATION MAIN MENU FUNCTION - INDEX.HTML ===========//

      // function handleMainMenuClick(buttonElement, targetMenuId) {
      //     // 1. Remove active highlights from all main buttons and sub-links
      //     document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
      //     document.querySelectorAll('.sub-nav-link').forEach(link => link.classList.remove('active'));
      //     // Highlight the clicked main button
      //     buttonElement.classList.add('active');
      //     // 🔴 CRUCIAL CHECK: If targetMenuId is null, empty, or 'none', just close all menus and exit
      //     if (!targetMenuId || targetMenuId === 'none') {
      //         document.querySelectorAll('.sub-menu-container').forEach(menu => menu.style.display = 'none');
      //         document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('open'));
      //         return; // Stop here, Dashboard is now safely highlighted
      //     }
      //     // 2. Fetch the target sub-menu panel container
      //     const targetMenu = document.getElementById(targetMenuId);   
      //     // Check if this menu is already open
      //     const isAlreadyOpen = targetMenu && targetMenu.style.display === 'block';
      //     // 3. Close ALL open dropdown menus first to keep UI compact
      //     document.querySelectorAll('.sub-menu-container').forEach(menu => menu.style.display = 'none');
      //     document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('open'));
      //     // 4. Toggle the target menu open or closed
      //     if (targetMenu && !isAlreadyOpen) {
      //         targetMenu.style.display = 'block';
      //         buttonElement.classList.add('open');
      //     }
      // }
     
 
// ***************  NAVIGATION SUBM MENU FUNCTION - INDEX.HTML  ********************//

function handleMainMenuClick(buttonElement, targetMenuId) {
    // 1. Remove active highlights from all elements
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.sub-nav-link').forEach(link => link.classList.remove('active'));
    
    buttonElement.classList.add('active');

    // Helper to force an arrow element to point UP
    const setArrowUp = (btn) => {
        const arrow = btn.querySelector('.arrow-indicator');
        if (arrow) arrow.style.transform = 'rotate(0deg)';
    };

    // Helper to force an arrow element to point DOWN
    const setArrowDown = (btn) => {
        const arrow = btn.querySelector('.arrow-indicator');
        if (arrow) arrow.style.transform = 'rotate(180deg)';
    };

    // 🔴 CRUCIAL CHECK: If targetMenuId is null/none, close all menus, reset all arrows up, and exit
    if (!targetMenuId || targetMenuId === 'none') {
        document.querySelectorAll('.sub-menu-container').forEach(menu => menu.style.display = 'none');
        document.querySelectorAll('.nav-btn').forEach(btn => setArrowUp(btn));
        return; 
    }

    const targetMenu = document.getElementById(targetMenuId);   
    const isAlreadyOpen = targetMenu && targetMenu.style.display === 'block';

    // 2. Close ALL other menus and reset all other arrows up first
    document.querySelectorAll('.sub-menu-container').forEach(menu => {
        if (menu !== targetMenu) menu.style.display = 'none';
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn !== buttonElement) setArrowUp(btn);
    });

    // 3. Forcefully sync the exact target menu state and the arrow together
    if (targetMenu) {
        if (isAlreadyOpen) {
            targetMenu.style.display = 'none';
            setArrowUp(buttonElement); // 🔒 FORCED UP (Stays up no matter what classes do)
        } else {
            targetMenu.style.display = 'block';
            setArrowDown(buttonElement); // 🔒 FORCED DOWN
        }
    }
}




function handleSubMenuClick(subLinkElement, event) {
    // If the master layout is already locked by an active form window, reject actions
    if (document.querySelector('.sidebar-pane').classList.contains('menu-locked')) {
        event.preventDefault();
        return; 
    }
    const href = subLinkElement.getAttribute('href'); // e.g., "/new-invoice"
 // 🎯 DYNAMIC MAPPER: Detects if the path targets a creation action form
    if (href && href.startsWith('/new-')) {
        event.preventDefault();
        
        // Converts "/new-invoice" -> "newinv-modal-overlay"
        // Converts "/new-quotation" -> "newquot-modal-overlay"
        // Converts "/new-purchase" -> "newpurch-modal-overlay"
        const cleanAction = href.replace('/new-', ''); 
        const shortCode = cleanAction.substring(0, 4); // Grabs 'inv', 'quot', 'purch'
        const computedModalId = `new${shortCode}-modal-overlay`;

        openAppModal(computedModalId);
        return; 
    }
            // Default visual selection state mechanics for standard iframe routing panels
            document.querySelectorAll('.sub-nav-link').forEach(link => link.classList.remove('active'));
            subLinkElement.classList.add('active');
}
//#endregion 

//#region === SCAN ALL MATCHING MODAL AND BUTTONS AND CLOSE ANY MODAL BY ID
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

//#region === OPEN NEW MODAL  ====================//
    //OPEN MODAL
      function openAppModal(modalId) {
          const modal = document.getElementById(modalId);
          if (!modal) {
              console.error(`Modal structure target matching context ID "${modalId}" not found in index.html DOM layout.`);
              return;
          }

        modal.style.display = 'flex';
        if (modalId === 'newquot-modal-overlay') {
            const today = new Date();
            const quoteDate = modal.querySelector('#newquot-invoice-date');
            if (quoteDate) quoteDate.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        }
        lockSidebarAndRefresh(true);
        setCurrentDate();
        // Autofill Dropdown Exterminator: Loops target scope container elements seamlessly
        const inputs = modal.querySelectorAll('input[type="text"], input:not([type])');
        inputs.forEach(input => {
            input.setAttribute('autocomplete', 'one-time-code');
        });
    }
      //CLOSE MODAL
      // function ccloseAppModal(modalId) {
      //     const modal = document.getElementById(modalId);
      //     if (!modal) return;

      //   modal.style.display = 'none';
      //   // document.getElementById('newinvo-invoice-master-form').reset();
      //   // document.getElementById('newinvo-modal-items-rows').innerHTML = '';
          
      //     // Pattern Matching Scanner: Checks if ANY structural modal container layout is active
      //     const genericModalOpen = Array.from(document.querySelectorAll('[id$="-modal-overlay"]'))
      //     .some(m => m.style.display === 'flex');
          
      //     if (!genericModalOpen) {
      //         lockSidebarAndRefresh(false); 
      //     }
      // }
//#endregion

//#region === LOCK SIDEBAR & BLOCK REFRESH KEYBOARD CONTROLS ===========//
      // 4. Global Hardware App Grid Lock Controls
      function lockSidebarAndRefresh(shouldLock) {
          const sidebar = document.querySelector('.sidebar-pane');
          if (!sidebar) return;

          if (shouldLock) {
              sidebar.classList.add('menu-locked');
              window.addEventListener('keydown', blockRefreshKeys);
              window.addEventListener('beforeunload', preventPageUnload);
          } else {
              sidebar.classList.remove('menu-locked');
              window.removeEventListener('keydown', blockRefreshKeys);
              window.removeEventListener('beforeunload', preventPageUnload);
          }
      }
      // Intercepts and blocks F5, Ctrl+R, and Cmd+R commands
      function blockRefreshKeys(e) {
          if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r')) {
              e.preventDefault();
              alert("Please save your changes or close the active workspace panel before refreshing the system window.");
          }
      }

      // Triggers a browser warning popup if they try to use the browser UI refresh button
      function preventPageUnload(e) {
          e.preventDefault();
          e.returnValue = '';
      }
      // 🎯 Expose this globally so the iframe can call it easily
        window.lockSidebarAndRefresh = lockSidebarAndRefresh;
//#endregion

//#region === MANAGE SIDE BAR MAIN AND SUBMENU DROPDOWN  ==============//
        const navButtons = document.querySelectorAll('.nav-btn');
        if (navButtons.length > 0) {
        navButtons.forEach(button => {
            button.addEventListener('click', function() {
            // 1. Handle visual highlighting and dropdown closing
            const targetMenuId = this.getAttribute('data-target'); 
            handleMainMenuClick(this, targetMenuId);

            // 2. 🟢 FIXED BLOCK: Load the URL into your iframe/content frame
            const targetUrl = this.getAttribute('data-url');
            const frameName = this.getAttribute('data-frame');

            // If a URL and frame name are provided (like on your Dashboard button), open it!
            if (targetUrl && frameName) {
                window.open(targetUrl, frameName);
            }
            });
        });
        }
        // 2. MANAGE SUB-MENU ITEMS (Removes focus border, updates selections, etc.)
        const subNavLinks = document.querySelectorAll('.sub-nav-link');
        if (subNavLinks.length > 0) {
          subNavLinks.forEach(link => {
            link.addEventListener('click', function(e) {
              // Safely run your custom click logic for children links
              if (typeof handleSubMenuClick === "function") {
                handleSubMenuClick(this, e);
              }
            });
          });
        }
//#endregion         

//#region === CLOSE MODAL, UNLOCK PARENT MENU, REFRESH IFRAME===========//
              // 3. Generic Modal Deactivation & Layout Restorer
              function closeAppModal(modalId) {
                const modal = document.getElementById(modalId);
                if (!modal) return;
                modal.style.display = "none";
                const activeForm = modal.querySelector('.global-master-form');
                activeForm?.reset();
                const itemsBody=modal.querySelector('.global-modal-items-rows');
                if(itemsBody)itemsBody.innerHTML = '';

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

//#endregion

//#region 📌📌 NEW INVOICE ALL CODES ===========//

//#region === HIDE AND VISIBLE SECRET FIELDS STARTS   ===================//
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

//#region === ADD TO TABLE BY CLICK ADD BUTTON  =======================//
                const tableBody = document.getElementById("newinvo-modal-items-rows");
                const btnadd = document.getElementById("newinv-btn-add");
                const item = document.getElementById("newinv-products");
                const quantity = document.getElementById("newinv-qty");
                const itemcode = document.getElementById("newinv-item-code");

                const isize = document.getElementById("newinv-i-size");
                const iral = document.getElementById("newinv-i-ral");
                const iunit = document.getElementById("newinv-i-unit");
                const uprice = document.getElementById("newinv-unit-price");

                const udiscper = document.getElementById("newinv-disc-per");
                const uvatper = document.getElementById("newinv-vat-per");
                const utaxable = document.getElementById("newinv-taxable");
                const vattotal = document.getElementById("newinv-vat-total");
                const utotal = document.getElementById("newinv-unit-total");
                const id = document.getElementById("newinv-pid");
                const stock = document.getElementById("newinv-a-stock");
                const openstock = document.getElementById("newinv-o-stock");

                const Icost = document.getElementById("newinv-i-cost");
                const Ucost = document.getElementById("newinv-u-cost");
                const Svalue = document.getElementById("newinv-s-value");
                const Umargin = document.getElementById("newinv-u-margin");
                //const status = "Delivered";

                // Listen for button click
                    btnadd.addEventListener('click', function() {
                    // 1. Get current values from text fields
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
                    const existingPId = row.cells[12].textContent.trim();
                    
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

                    // 4. Insert cell data into the row
                    newRow.innerHTML = `
                        <td style="color:blue; font-size:12px; font-weight:600; padding:0px; text-align:center">${nextSrNo}</td>
                        <td style="color:blue; font-size:12px; font-weight:600; padding:0px">${itemrow}</td>
                        <td class="row-qty" style="color:blue; font-size:12px; font-weight:600;  padding:0px">${qtyrow}</td>
                        <td style="color:blue; font-size:12px; font-weight:600;  padding:0px">${isizerow || "-"}</td>
                        <td style="color:blue; font-size:12px; font-weight:600;  padding:0px">${iralrow || "-"}</td>
                        <td style="color:blue; font-size:12px; font-weight:600;  padding:0px">${iunitrow || "-"}</td>
                        <td style="color:blue; font-size:12px; font-weight:600;  padding:0px">${parseFloat(upricerow).toFixed(2)}</td>

                        <td style="color:blue; font-size:12px; font-weight:600;  padding:0px">${parseFloat(udiscperrow).toFixed(2)}</td>
                        <td style="color:blue; font-size:12px; font-weight:600;  padding:0px">${parseFloat(uvatperrow).toFixed(2)}</td>
                        <td class="row-taxable" style="color:blue; font-size:12px; font-weight:600;  padding:0px">${parseFloat(utaxablerow).toFixed(2)}</td>
                        <td class="row-vattotal" style="color:blue; font-size:12px; font-weight:600;  padding:0px">${parseFloat(vattotalrow).toFixed(2)}</td>
                        <td class="row-unittotal" style="color:blue; font-size:12px; font-weight:600;  padding:0px">${parseFloat(utotalrow).toFixed(2)}</td>
                        <td style="color:blue; font-size:12px; font-weight:600;  padding:0px">${idrow}</td>
                        <td style="color:blue; font-size:12px; font-weight:600;  padding:0px">${stockrow}</td>

                        <td style="color:blue; font-size:12px; font-weight:600;  padding:0px">${parseFloat(icostrow).toFixed(2)}</td>
                        <td class="row-unitcost" style="color:blue; font-size:12px; font-weight:600;  padding:0px">${parseFloat(Ucostrow).toFixed(2)}</td>
                        <td style="color:blue; font-size:12px; font-weight:600;  padding:0px">${parseFloat(Svaluerow).toFixed(2)}</td>
                        <td class="row-unitmargin" style="color:blue; font-size:12px; font-weight:600;  padding:0px">${parseFloat(Umarginrow).toFixed(2)}</td>
                        <td style="color:blue; font-size:12px; font-weight:600;  padding:0px">${statusrow}</td>
                    `;

                    // 5. Append the row to the bottom of the table body
                    tableBody.appendChild(newRow);
                    recalculateNewInvoiceSerialNumbers();
                    // Execute the calculation
                    calculateGrandtotal();
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

//#region === INVOICE CALCULATE GRAND TOTAL  =========================//
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

//#region === CURRENT DATE FORMATING ====================================//
                function setCurrentDate() {
                const invdate = document.getElementById('newinv-invoice-date');
                const deldate = document.getElementById('newinv-deliver-date');
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
                invdate.value = formattedDate;
                deldate.value = formattedDate;
                }
//#endregion

//#region === SAVE NEW INVOICE API BY UPDATE BUTTON =====================//

                    function closeNewinvModal() {
                    document.getElementById('newinv-modal-overlay').style.display = 'none';
                    //document.getElementById('edit-invoice-master-form').reset();
                    //document.getElementById('edit-modal-items-rows').innerHTML = '';
                }

                // Handle form submission
                document.getElementById('newinvo-invoice-master-form').addEventListener('submit', function(event) {
                    event.preventDefault();
                    // Add your form submission logic here
                    alert('Invoice created successfully!');
                    closeNewinvModal();
                });

        document.getElementById("btn-save-newinvoice").addEventListener("click", async function() {
          
          // 1. Gather master fields from your top form inputs layout elements
          const invoiceMainData = {
           Customer : document.getElementById("newinv-customer").value,
           PostBox : document.getElementById("newinv-postbox").value, 
           Emirate : document.getElementById("newinv-emirate").value, 
           Address : document.getElementById("newinv-address").value, 
           VatID : document.getElementById("newinv-vat-no").value, 
           InvoiceDate : document.getElementById ("newinv-invoice-date")?.value,
           //InvoiceNo : document.getElementById("newinv-invoice-no").value,
           LPONo : document.getElementById("newinv-lpo-no").value, 
           CONo : document.getElementById("newinv-co-no").value, 
           PaymentTerms: document.getElementById("newinv-payment-terms").value,
           CustContact: document.getElementById("newinv-contact-person").value,
           CustConNumber: document.getElementById("newinv-contact-number").value,
           ProjectName: document.getElementById("newinv-project-name").value,
           DeliveryDate: document.getElementById("newinv-deliver-date").value,
           OurContact: document.getElementById("newinv-our-contact").value,
           OurNumber: document.getElementById("newinv-our-number").value,
           Description : document.getElementById("newinv-notes").value,

           SubTotal : parseFloat(document.getElementById("newinv-taxable-value")?.value || 0),
           VatTotal : parseFloat(document.getElementById("newinv-total-vat")?.value || 0),
           GrandTotal : parseFloat(document.getElementById("newinv-grand-total")?.value || 0),
           InvCost : parseFloat(document.getElementById("newinv-t-cost")?.value || 0),
           InvMargin : parseFloat(document.getElementById("newinv-t-margin")?.value || 0),
           //Status : document.getElementById("newinv-status").value,
           InWords : document.getElementById("newinv-amount-in-words").value,
          };

          // 2. Read and map your active row item array configurations dynamically 
          const itemsArray = [];
          const rows = document.querySelectorAll("#newinvo-modal-items-rows tr");

          rows.forEach(row => {
            // Collect the dynamic modified quantities inputs from the cells template
            const qtyInput = row.querySelector(".row-qty");
            
            if (qtyInput) {
              itemsArray.push({
                SrNo: row.cells[0].textContent.trim(),
                Item: row.cells[1].textContent.trim(),
                Quantity: row.cells[2].textContent.trim(),
                Isize: row.cells[3].textContent.trim(),
                IRAL: row.cells[4].textContent.trim(),
                Iunit: row.cells[5].textContent.trim(),
                UnitPrice: row.cells[6].textContent.trim(),
                Discount: row.cells[7].textContent.trim(),
                VatPer: row.cells[8].textContent.trim(),
                Taxable: row.cells[9].textContent.trim(),
                VatTotal: row.cells[10].textContent.trim(),
                UnitTotal: row.cells[11].textContent.trim(),
                PID: row.cells[12].textContent.trim(),
                stock: row.cells[13].textContent.trim(),
                Icost: row.cells[14].textContent.trim(),
                Ucost: row.cells[15].textContent.trim(),
                tcost: row.cells[16].textContent.trim(),
                Umargin: row.cells[17].textContent.trim()
              });
            }
          });
          

          // Verification step
          if (itemsArray.length === 0) {
            alert("Cannot save an empty Invoice document.");
            return;
          }

          // 3. Assemble the structural JSON data payload container
          const payloadData = {
            main: invoiceMainData,
            
            items: itemsArray
          };

          try {
            // 4. Dispatch AJAX data package via HTTP pipeline
            const response = await fetch('/api/save-newinvoice', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payloadData)
            });

            const result = await response.json();

            if (result.success) {
               // Unlock page mechanisms and close main modal here
                  window.removeEventListener("keydown", localIframeBlockRefresh);
                  if (window.parent && window.parent.lockSidebarAndRefresh) {
                      window.parent.lockSidebarAndRefresh(false);
                  }
                  document.getElementById("newinvo-modal-overlay").style.display = "none";
                  document.getElementById('newinvo-invoice-master-form').reset();
                  document.getElementById('newinvo-modal-items-rows').innerHTML = '';

             //====================================================//
            // 1. Close this second modal (using your existing modal close code)
            // e.g., mySecondModal.close() or $('#secondModal').modal('hide');

            // 2. Reach out to the parent (index.html) to interact with its DOM
            const parentDoc = window.parent.document;

            // 3. Find and click the parent dropdown button to open it
            const dropdownButton = parentDoc.getElementById("btn-invoices");
            if (dropdownButton) {
                dropdownButton.click(); 
            }

            // 4. Find and click the specific link inside that dropdown
            const dropdownLink = parentDoc.getElementById("view-invoices");
            if (dropdownLink) {
                dropdownLink.click();
            }

            // 5. Force the index.html iframe to load the new HTML file
            const mainIframe = parentDoc.getElementById("main-content-viewport");
            if (mainIframe) {
                mainIframe.src = "/invoices"; // Adjust the path as necessary
            }

             //===================================================//


              // 5. Notify the manager and show them the exact final tracking ID stamped by your database pool
              alert(`Success! Invoice Saved as No: ${result.allocatedNumber}`);
              
              // Close out overlays and refresh your main data metrics panels
              document.getElementById("newinvo-modal-overlay").style.display = "none";
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

//#region === NEW INVOICE INPUT UPPERCASE ===========================//
                
                // Force user typed input data to be strictly uppercase strings
                const searchcustomer = document.getElementById("newinv-customer");
                searchcustomer.addEventListener("input", (e) => {
                e.target.value = e.target.value.toUpperCase();
                });
                // Force user typed input data to be strictly uppercase strings
                const searchpostbox = document.getElementById("newinv-postbox");
                searchpostbox.addEventListener("input", (e) => {
                e.target.value = e.target.value.toUpperCase();
                });
                // Force user typed input data to be strictly uppercase strings
                const searchemirate = document.getElementById("newinv-emirate");
                searchemirate.addEventListener("input", (e) => {
                e.target.value = e.target.value.toUpperCase();
                });
                // Force user typed input data to be strictly uppercase strings
                const searchaddress = document.getElementById("newinv-address");
                searchaddress.addEventListener("input", (e) => {
                e.target.value = e.target.value.toUpperCase();
                });
//#endregion ===================================================//

//#region === CALCULATE UNIT TOTAL NEW INVOICE ============================//
      // Get references to all elements
              const unitprice = document.getElementById('newinv-unit-price');
              const qty = document.getElementById('newinv-qty');
              const discper = document.getElementById('newinv-disc-per');
              const vatper = document.getElementById('newinv-vat-per');
              const taxable = document.getElementById('newinv-taxable');
              const unitvat = document.getElementById('newinv-vat-total');
              const unittotal = document.getElementById('newinv-unit-total');

              const icost = document.getElementById('newinv-i-cost');
              const discamt = document.getElementById('newinv-disc-amt');
              const ucost = document.getElementById('newinv-u-cost');
              const umargin = document.getElementById('newinv-u-margin');
              const svalue = document.getElementById('newinv-s-value');
              const tcost = document.getElementById('newinv-t-cost');
              const tmargin = document.getElementById('newinv-t-margin');
              const ostock = document.getElementById('newinv-o-stock');
              const astock = document.getElementById('newinv-a-stock');

              const subtotal = document.getElementById('newinv-taxable-value');
              const totalvat = document.getElementById('newinv-total-vat');
              const grandtotal = document.getElementById('newinv-grand-total');
              const inwords = document.getElementById('newinv-amount-in-words');

                // Function to calculate percentage-based totals
      function calculateDynamicInvoiceTotal() {
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


        // 2. Calculate the subtotal for the given quantity
        //const Utotalinv = invUnetPrice * invUquantity;   // taxable amount

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
      unitprice.addEventListener('input', calculateDynamicInvoiceTotal);
      qty.addEventListener('input', calculateDynamicInvoiceTotal);
      discper.addEventListener('input', calculateDynamicInvoiceTotal);
      vatper.addEventListener('input', calculateDynamicInvoiceTotal);

//#endregion 

//#region === RIGHT CLICK CONTEXT MENU ACTIONS - NEW INVOICE ITEMS ROW 
       
              // ⚡ LEFT-CLICK MULTI-SELECTION LISTENER
            document.getElementById("newinvo-modal-items-rows").addEventListener("click", function (e) {
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
              const invItemContext = document.querySelectorAll(".newinvo-context-item");
              invItemContext.forEach((item) => {item.addEventListener("click", (e) => {
              const actionType = e.currentTarget.getAttribute("data-action");
                  if (actionType) {ItemMenuAction(actionType);} }); 
              });

              // item context menu click action
                function ItemMenuAction(actionType) {
                document.getElementById("newinvo-context-menu").style.display ="none";
                const targetRow = document.querySelector(".newinvo-row-highlight-context",);
                
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
                  const SelectedSr =  cells[0].innerText.trim() || cells[0].textContent.trim();
                  const SelectedProduct =  cells[1].innerText.trim() || cells[1].textContent.trim();
                  const SelectedQty =  cells[2].innerText.trim() || cells[2].textContent.trim();
                  const SelectedSize =  cells[3].innerText.trim() || cells[3].textContent.trim();

                  const SelectedRal =  cells[4].innerText.trim() || cells[4].textContent.trim();
                  const SelectedUnit =  cells[5].innerText.trim() || cells[5].textContent.trim();
                  const SelectedUnitPrice =  cells[6].innerText.trim() || cells[6].textContent.trim();
                  const SelectedDiscper =  cells[7].innerText.trim() || cells[7].textContent.trim();

                  const SelectedVatper =  cells[8].innerText.trim() || cells[8].textContent.trim();
                  const SelectedTaxable =  cells[9].innerText.trim() || cells[9].textContent.trim();
                  const SelectedVattotal =  cells[10].innerText.trim() || cells[10].textContent.trim();
                  const SelectedUnittotal =  cells[11].innerText.trim() || cells[11].textContent.trim();

                  const SelectedPid =  cells[12].innerText.trim() || cells[12].textContent.trim();
                  const SelectedStock =  cells[13].innerText.trim() || cells[13].textContent.trim();
                  const SelectedIcost =  cells[14].innerText.trim() || cells[14].textContent.trim();
                  const SelectedUcost =  cells[15].innerText.trim() || cells[15].textContent.trim();
                  const SelectedSvalue =  cells[16].innerText.trim() || cells[16].textContent.trim();
                  const SelectedUmargin =  cells[17].innerText.trim() || cells[17].textContent.trim();
                  // Inject clean unformatted values directly into modal fields
                  document.getElementById("newinvitems-title-text").innerText = window.matchMedia("(max-width: 767px)").matches ? "Edit Row - Sr No- " + SelectedSr : "EDIT INVOICE ITEMS RAW - Sr No: " + SelectedSr;
                  document.getElementById("newinvitems-sr-number").value = SelectedSr ;
                  document.getElementById("newinvitems-product").value = SelectedProduct ;
                  document.getElementById("newinvitems-qty").value = SelectedQty ;
                  document.getElementById("newinvitems-i-size").value = SelectedSize ;

                  document.getElementById("newinvitems-i-ral").value = SelectedRal ;
                  document.getElementById("newinvitems-i-unit").value = SelectedUnit ;
                  document.getElementById("newinvitems-unit-price").value = parseFloat(SelectedUnitPrice).toFixed(2) ;
                  document.getElementById("newinvitems-disc-per").value = parseFloat(SelectedDiscper).toFixed(2) ;

                  document.getElementById("newinvitems-vat-per").value = parseFloat(SelectedVatper).toFixed(2) ;
                  document.getElementById("newinvitems-taxable").value = parseFloat(SelectedTaxable).toFixed(2) ;
                  document.getElementById("newinvitems-vat-total").value = parseFloat(SelectedVattotal).toFixed(2) ;
                  document.getElementById("newinvitems-unit-total").value = parseFloat(SelectedUnittotal).toFixed(2) ;

                  document.getElementById("newinvitems-pid").value = SelectedPid ;
                  document.getElementById("newinvitems-o-stock").value = Number(SelectedStock) + Number(SelectedQty) ;
                  document.getElementById("newinvitems-a-stock").value = SelectedStock ;
                  document.getElementById("newinvitems-i-cost").value = parseFloat(SelectedIcost).toFixed(2) ;
                  document.getElementById("newinvitems-u-cost").value = parseFloat(SelectedUcost).toFixed(2) ;
                  document.getElementById("newinvitems-s-value").value = parseFloat(SelectedSvalue).toFixed(2) ;
                  document.getElementById("newinvitems-u-margin").value =parseFloat( SelectedUmargin).toFixed(2) ;

                  // Display Modal overlay
                  document.getElementById("newinvitems-modal-overlay").style.display = "flex";
                  calculateItemModalTotal();
                }           //action type EDIT ends here
                 else if (actionType === "DELETE") {
                // 1. 🎯 Find the row element safely (supports both arrays and raw elements)
                const targetElement = cells[0] || cells; 
                const rowToDelete = targetElement.closest ? targetElement.closest("tr") : cells.parentElement;

                // 2. Safety check: make sure we actually found a <tr> row element
                if (!rowToDelete) {
                    console.error("Could not locate the table row element to delete.");
                    return;
                }
                // 2. Prompt the user with a clean confirmation dialog
                if (confirm("Are you sure you want to delete this item row?")) {
                    
                    // 3. Remove the row from the HTML table structure
                    rowToDelete.remove();

                    // 4. 🎯 CALL YOUR EXISTING FOOTER SUMMATION FUNCTION HERE
                    // Replace 'recalculateInvoiceTotals' with the actual name of your summary function
                    //calculateInvGrandtotal();
                    
                    // 5. (Optional) Renumber Serial Numbers if your table depends on sequential order
                    recalculateNewInvoiceSerialNumbers(); 
                }
                }

                }
         
//#endregion

//#region === OPEN ITEMS EDIT DYNAMIC CONTEXT MENU //
                document.getElementById("newinvo-modal-items-rows").addEventListener("contextmenu", function (e) {
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
                  document.querySelectorAll("#newinvo-modal-items-rows tr").forEach((row) =>
                      row.classList.remove("newinvo-row-highlight-context"),
                    );
                  clickedRow.classList.add("newinvo-row-highlight-context");

                const menuElement = document.getElementById("newinvo-context-menu");
                
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
                  "newinvo-context-menu",
                );
                if (!e.target.closest("#newinvo-context-menu")) {
                  menuElement.style.display = "none";
                  document
                    .querySelectorAll("#newinvo-modal-items-rows tr")
                    .forEach((row) =>
                      row.classList.remove("newinvo-row-highlight-context"),
                    );
                }
                
  
              });
//#endregion

//#region === ITEMS MODAL CALCULATE UNIT TOTAL
                        // Get references to all elements
              const Iunitprice = document.getElementById('newinvitems-unit-price');
              const Iqty = document.getElementById('newinvitems-qty');
              const Idiscper = document.getElementById('newinvitems-disc-per');
              const Ivatper = document.getElementById('newinvitems-vat-per');
              const Itaxable = document.getElementById('newinvitems-taxable');
              const Iunitvat = document.getElementById('newinvitems-vat-total');
              const Iunittotal = document.getElementById('newinvitems-unit-total');

              const Iicost = document.getElementById('newinvitems-i-cost');
              const Idiscamt = document.getElementById('newinvitems-disc-amt');
              const Iucost = document.getElementById('newinvitems-u-cost');
              const Iumargin = document.getElementById('newinvitems-u-margin');
              const Isvalue = document.getElementById('newinvitems-s-value');
              // const tcost = document.getElementById('t-cost');
              // const tmargin = document.getElementById('t-margin');
              const Iostock = document.getElementById('newinvitems-o-stock');
              const Iastock = document.getElementById('newinvitems-a-stock');

              // const subtotal = document.getElementById('taxable-value');
              // const totalvat = document.getElementById('total-vat');
              // const grandtotal = document.getElementById('grand-total');
              // const inwords = document.getElementById('amount-in-words');

                // Function to calculate percentage-based totals
              function calculateItemModalTotal() {
                // Convert text values to numbers (fallback safely if fields are empty)
                const invUprice = parseFloat(Iunitprice.value) || 0;     // UnitPrice value
                const invUquantity = parseFloat(Iqty.value) || 0;        // Qty value
                const invUdiscountPct = parseFloat(Idiscper.value) || 0; // Discount percentage
                const invUvatPct = parseFloat(Ivatper.value) || 0;       // Vat percentage
                const invItemcost = parseFloat(Iicost.value) || 0;   // Item cost
                const invStock = parseFloat(Iostock.value) || 0;   // Item cost
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
                Itaxable.value = Utotalinv.toFixed(2); // display taxable
                Iunitvat.value = Uvat.toFixed(2); // display unit vat
                Iunittotal.value = Uinvtotal.toFixed(2);// display unit total
                Idiscamt.value = invUdiscAmount.toFixed(2);// display discount amount
                Iucost.value = invUcost.toFixed(2);// display Unit cost invMargin
                Iumargin.value = invUmargin.toFixed(2);// display invMargin
        
                if (invSvalue <= 0) {
                  Isvalue.value = "0.00";// if zero
                }else{
                Isvalue.value = invSvalue.toFixed(2);// display S Value
                }
                if (invAstock <= 0) {
                  Iastock.value = "0";// if zero
                }else{
                  Iastock.value = invAstock;// display Stock
                }
                
              }

            // Attach event listeners to all 4 input fields
      Iunitprice.addEventListener('input', calculateItemModalTotal);
      Iqty.addEventListener('input', calculateItemModalTotal);
      Idiscper.addEventListener('input', calculateItemModalTotal);
      Ivatper.addEventListener('input', calculateItemModalTotal);
//#endregion  

//#region === SAVE ITEMS MODAL BY UPDATE BUTTON
document.getElementById("newinvitems-update-button").addEventListener("click", function(e) {
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
    targetCells[0].textContent = document.getElementById("newinvitems-sr-number").value;
    targetCells[1].textContent = document.getElementById("newinvitems-product").value;
    targetCells[2].textContent = document.getElementById("newinvitems-qty").value;
    targetCells[3].textContent = document.getElementById("newinvitems-i-size").value;
    
    targetCells[4].textContent = document.getElementById("newinvitems-i-ral").value;
    targetCells[5].textContent = document.getElementById("newinvitems-i-unit").value;
    // 🎯 Force Unit Price to 10.00 format
    const unitPriceValue = parseFloat(document.getElementById("newinvitems-unit-price").value) || 0;
    targetCells[6].textContent = unitPriceValue.toFixed(2);
    // 🎯 Force Discount Percentage to 10.00 format
    const discPerValue = parseFloat(document.getElementById("newinvitems-disc-per").value) || 0;
    targetCells[7].textContent = discPerValue.toFixed(2);
    
    // 🎯 Force VAT Percentage to 10.00 format
    const vatPerValue = parseFloat(document.getElementById("newinvitems-vat-per").value) || 0;
    targetCells[8].textContent = vatPerValue.toFixed(2);
    // 🎯 Force Taxable Amount to 10.00 format
    const taxableValue = parseFloat(document.getElementById("newinvitems-taxable").value) || 0;
    targetCells[9].textContent = taxableValue.toFixed(2);
       // 🎯 Force VAT Total to 10.00 format
    const vatTotalValue = parseFloat(document.getElementById("newinvitems-vat-total").value) || 0;
    targetCells[10].textContent = vatTotalValue.toFixed(2);
    // 🎯 Force Unit Total to 10.00 format
    const unitTotalValue = parseFloat(document.getElementById("newinvitems-unit-total").value) || 0;
    targetCells[11].textContent = unitTotalValue.toFixed(2);
    
    targetCells[12].textContent = document.getElementById("newinvitems-pid").value;
    // For stock, map it back to your actual target tracking requirements 
    targetCells[13].textContent = document.getElementById("newinvitems-a-stock").value; 
    // 🎯 Force I cost to 10.00 format
    const IcostValue = parseFloat(document.getElementById("newinvitems-i-cost").value) || 0;
    targetCells[14].textContent = IcostValue.toFixed(2);
    // 🎯 Force U cost to 10.00 format
    const UcostValue = parseFloat(document.getElementById("newinvitems-u-cost").value) || 0;
    targetCells[15].textContent = UcostValue.toFixed(2);
    // 🎯 Force S value to 10.00 format
    const SValue = parseFloat(document.getElementById("newinvitems-s-value").value) || 0;
    targetCells[16].textContent = SValue.toFixed(2);
    // 🎯 Force Umargin to 10.00 format
    const Umargin = parseFloat(document.getElementById("newinvitems-u-margin").value) || 0;
    targetCells[17].textContent = Umargin.toFixed(2);

    // 🎯 1. Apply the temporary visual flash effect to the row
    activeEditingRow.classList.add("flash-updated-row");

    // 🎯 2. Automatically remove the class after the animation ends (2 seconds) 
    // so it can flash again if edited a second time
    const rowToClear = activeEditingRow; // Hold reference for the timeout
    setTimeout(() => {
        rowToClear.classList.remove("flash-updated-row");
    }, 2000);

    // 4. Close your secondary modal (Example ID)
    document.getElementById("newinvitems-modal-overlay").style.display = "none";
    document.getElementById("newinvitems-transaction-form").reset();
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
                calculateGrandtotal();
    
});
//#endregion

//#endregion === NEW INVOICE MODAL

//#region 📌📌 NEW QUOTATION ALL CODES ===========//

//#endregion

//#region 📌📌 NEW LPO ALL CODES ===========//

//#endregion

//#region 📌📌 NEW CO ALL CODES ===========//

//#endregion

//#region 📌📌 NEW CUSTOMER ALL CODES ===========//

//#endregion

//#region 📌📌 NEW PRODUCTS ALL CODES ===========//

//#endregion

//#region 📌📌 NEW PURCHASE ALL CODES ===========//

//#endregion

//#region 📌📌 NEW EXPENSES ALL CODES ===========//

//#endregion


//#region 📌📌  DOM CONTENT LOADED  =============//
    document.addEventListener("DOMContentLoaded", function () {

//#region ==== CENTRALIZED EVENT LISTNER FOR AUTOCOMPLETE ====    
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

    // 3. Centralized Event Listener for Typing (Handles Customer , Product and Product Code globally)
    document.addEventListener("input", function(event) {
        const target = event.target;
        if(target.id==='newcust-customer')return;
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
//#endregion

//#region === EMIRATE, ADDRESS, AND PAYMENT TERMS CUSTOM COMBO CODES ==//

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
//#endregion
}); //DOM CONTENT LOAD ENDS
//#endregion 

//#region 📌📌  CENTRALIZED CUSTOMER SEARCH ENGINE ====
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
//#endregion

//#region 📌📌  CENTRALIZED PRODUCT SEARCH ENGINE ====
async function handleProductSearch(value, activeModal, resultsList) {
    // DOM element references for product search and form fields//
                const searchProduct = activeModal.querySelector('.global-products');
                const searchProductCode = activeModal.querySelector('.global-item-code');
                const productResultsList = activeModal.querySelector('.global-product-autocomplete-results');
                const productCodeResultsList = activeModal.querySelector('.global-item-code-autocomplete-results');
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
            if (ostockInput) ostockInput.value = product.stock || '0';
  
            resultsList.classList.add("d-none");
            if (activeModal.id === 'newco-modal-overlay') window.calculateDynamicCOTotal?.();
            else if (activeModal.id === 'newquot-modal-overlay') window.calculateDynamicQuotationTotal?.();
            else calculateDynamicInvoiceTotal(); 
        });
        resultsList.appendChild(li);
    });
    resultsList.classList.remove("d-none");
}
//#endregion

//#region 📌📌  CENTRALIZED PRODUCT CODE SEARCH ENGINE ====
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
            else if (activeModal.id === 'newquot-modal-overlay') window.calculateDynamicQuotationTotal?.();
            else calculateDynamicInvoiceTotal(); 
        });
        resultsList.appendChild(li);
    });
    resultsList.classList.remove("d-none");
}
//#endregion ==============================

//#region 📌📌  OPENING AND CLOSING AUTOCOMPLETE LIST =======
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
//#endregion







//#region === OLD EDIT invoice modal close function OLD ========================//
                function closeNewinvModal() {
                    //document.getElementById('newinv-modal-overlay').style.display = 'none';
                    // Run this inside your modal's Close/Cancel button event listener handler
                      document.getElementById('newinvo-modal-overlay').style.display = 'none';
                      lockSidebarAndRefresh(false); // Restores sidebar clicks and normal browser refresh behaviors
                    document.getElementById('edit-invoice-master-form').reset();
                    //document.getElementById('edit-modal-items-rows').innerHTML = '';
                }
//#endregion 







   

        
    


// Shared avatar dropdown. Destinations can be set with data-login-url/data-settings-url on body.
(() => {
  function initializeAvatarDropdown() {
    if (document.querySelector('.erp-account-dropdown')) return;
    const triggers = Array.from(document.querySelectorAll('.mobile-header-avatar, .sidebar-account-trigger'));
    if (!triggers.length) return;
    const dropdown = document.createElement('nav');
    dropdown.className = 'erp-account-dropdown';
    dropdown.id = 'erp-account-dropdown';
    dropdown.setAttribute('aria-label', 'Account');
    dropdown.hidden = true;
    [['Login', document.body.dataset.loginUrl || '/login.html'], ['Settings', document.body.dataset.settingsUrl || '/settings']].forEach(([label, url]) => {
      const link = document.createElement('a');
      link.textContent = label;
      link.href = url;
      link.target = '_top';
      dropdown.appendChild(link);
    });
    document.body.appendChild(dropdown);
    let active = null;
    function close(restoreFocus = false) {
      dropdown.hidden = true;
      if (active) {
        active.setAttribute('aria-expanded', 'false');
        if (restoreFocus) active.focus();
      }
      active = null;
    }
    function position() {
      if (!active) return;
      const rect = active.getBoundingClientRect();
      const gap = 6, edge = 8;
      const width = dropdown.offsetWidth, height = dropdown.offsetHeight;
      dropdown.style.left = Math.max(edge, Math.min(rect.right - width, innerWidth - width - edge)) + 'px';
      dropdown.style.top = Math.max(edge, rect.bottom + gap + height <= innerHeight - edge ? rect.bottom + gap : rect.top - height - gap) + 'px';
    }
    function toggle(trigger) {
      if (active === trigger && !dropdown.hidden) return close();
      close(); active = trigger;
      trigger.setAttribute('aria-expanded', 'true');
      dropdown.hidden = false;
      position();
    }
    triggers.forEach(trigger => {
      if (trigger.tagName !== 'BUTTON') { trigger.setAttribute('role', 'button'); trigger.tabIndex = 0; }
      trigger.setAttribute('aria-label', 'Account options');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-controls', dropdown.id);
      trigger.classList.add('erp-avatar-trigger');
      trigger.addEventListener('click', () => toggle(trigger));
      trigger.addEventListener('keydown', event => {
        if (trigger.tagName !== 'BUTTON' && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); toggle(trigger); }
        if (event.key === 'ArrowDown') { event.preventDefault(); if (active !== trigger) toggle(trigger); dropdown.querySelector('a').focus(); }
      });
    });
    document.addEventListener('click', event => {
      if (!dropdown.contains(event.target) && !triggers.some(trigger => trigger.contains(event.target))) close();
    });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && active) { event.preventDefault(); close(true); } });
    document.addEventListener('focusin', event => { if (active && !dropdown.contains(event.target) && !triggers.some(trigger => trigger.contains(event.target))) close(); });
    window.addEventListener('resize', () => close());
    window.addEventListener('scroll', () => close(), true);
    document.querySelectorAll('iframe').forEach(frame => {
      frame.addEventListener('load', () => { try { frame.contentDocument?.addEventListener('pointerdown', () => close()); } catch (_) {} });
      try { frame.contentDocument?.addEventListener('pointerdown', () => close()); } catch (_) {}
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeAvatarDropdown);
  else initializeAvatarDropdown();
})();

// Give the nested item editor a scrolling body and a separate action footer.
(() => {
  function setupItemEditor() {
    const form = document.getElementById('newinvitems-transaction-form');
    if (!form || form.querySelector('.item-editor-fields')) return;
    const footer = form.lastElementChild;
    const fields = document.createElement('div');
    fields.className = 'item-editor-fields';
    Array.from(form.children).filter(el => el !== footer).forEach(el => fields.appendChild(el));
    form.insertBefore(fields, footer);
    footer.classList.add('item-editor-actions');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupItemEditor);
  else setupItemEditor();
})();

// Keep the nested item editor within the mobile browser's visible viewport.
(() => {
  function initializeItemViewport() {
    const modal = document.getElementById('newinvitems-modal-overlay');
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

// Quotation mobile groups. Existing field nodes return to their original desktop positions.
(() => {
  function initializeQuotationMobileLayout() {
    const modal = document.getElementById('newquot-modal-overlay');
    const form = document.getElementById('newquot-invoice-master-form');
    if (!modal || !form || form.dataset.quotationLayoutReady) return;
    form.dataset.quotationLayoutReady = 'true';
    const definitions = [
      ['Customer Details', [
        ['customer'], ['postbox', 'emirate'], ['address'],
        ['vat-no', 'invoice-date'], ['contact-person', 'contact-number']
      ]],
      ['Quotation Details', [
        ['ref-no', 'validity-terms'], ['subject'], ['payment-terms'],
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
    const tableRow = originalRows.find(row => row.querySelector('#newquot-invoice-table'));
    tableRow?.classList.add('invoice-mobile-table-section');
    const header = modal.firstElementChild?.firstElementChild;
    header?.classList.add('mobile-entry-head');
    const heading = modal.querySelector('h4');
    if (heading) heading.dataset.mobileTitle = 'New Quotation';
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
      body.id = 'quotation-mobile-group-' + (index + 1);
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
          const control = document.getElementById('newquot-' + suffix);
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
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeQuotationMobileLayout);
  else initializeQuotationMobileLayout();
})();

// New quotation calculations and Add Item (scoped to avoid invoice totals).
(function () {
  function initializeQuotationItems() {
    const form = document.getElementById('newquot-invoice-master-form');
    const body = document.getElementById('newquot-modal-items-rows');
    const button = document.getElementById('newquot-btn-add');
    if (!form || !body || !button || form.dataset.quotationItemsReady) return;
    form.dataset.quotationItemsReady = 'true';
    const field = name => document.getElementById('newquot-' + name);
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
    window.calculateDynamicQuotationTotal = calculate;
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
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeQuotationItems);
  else initializeQuotationItems();
})();

// Save the new quotation using quotmain field names.
(function () {
  function initializeQuotationSave() {
    const button = document.getElementById('btn-save-newquot');
    if (!button || button.dataset.quotationSaveReady) return;
    button.dataset.quotationSaveReady = 'true';
    let saving = false;
    button.addEventListener('click', async function () {
      if (saving) return;
      const value = name => document.getElementById('newquot-' + name).value.trim();
      if (!value('customer')) return alert('Please select or enter the customer.');
      if (!value('invoice-date')) return alert('Please enter the quotation date.');
      const rows = Array.from(document.getElementById('newquot-modal-items-rows').rows);
      if (!rows.length) return alert('Please add at least one quotation item before saving.');
      const fields = {Customer:'customer', Postbox:'postbox', Address:'address', Emirate:'emirate', VatNo:'vat-no',
        QuotationDate:'invoice-date', Notes:'notes', InWords:'amount-in-words', Validity:'validity-terms',
        PaymentTerms:'payment-terms', QuoteType:'type', RefNo:'ref-no', CustContact:'contact-person',
        ContactNo:'contact-number', Subject:'subject', DeliveryTerms:'delivery-terms', OurContact:'our-contact',
        OurNumber:'our-number', ProjectName:'project-name', CurrencyType:'currency'};
      const main = Object.fromEntries(Object.entries(fields).map(([key, name]) => [key, value(name)]));
      for (const [key, name] of Object.entries({SubTotal:'taxable-value', VatTotal:'total-vat', GrandTotal:'grand-total', InvCost:'t-cost', InvMargin:'t-margin'})) main[key] = Number(value(name));
      const items = rows.map((row, index) => {
        const cell = n => row.cells[n].textContent.trim();
        return {SrNo:index + 1, Item:cell(1), Quantity:Number(cell(2)), ISize:cell(3), IRAL:cell(4), IUnit:cell(5),
          UnitPrice:Number(cell(6)), LessDiscount:Number(cell(7)), VatPer:Number(cell(8)), UnitTaxable:Number(cell(9)),
          VatTotal:Number(cell(10)), TotalPrice:Number(cell(11)), PID:cell(12), Stock:Number(cell(13)),
          Icost:Number(cell(14)), Ucost:Number(cell(15)), Umargin:Number(cell(17))};
      });
      saving = true;
      button.disabled = true;
      const label = button.textContent;
      button.textContent = 'Saving…';
      let savedNumber;
      try {
        const response = await fetch('/api/save-newquotation', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({main, items})});
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || result.error || 'Quotation could not be saved.');
        savedNumber = result.allocatedNumber;
      } catch (error) {
        alert('Could not save quotation: ' + error.message);
        return;
      } finally {
        saving = false;
        button.disabled = false;
        button.textContent = label;
      }
      // Saving succeeded: navigation errors must never suggest saving again.
      try {
        if (typeof forceResetModalLock === 'function') forceResetModalLock('newquot-modal-overlay');
        if (typeof closeAppModal === 'function') closeAppModal('newquot-modal-overlay');
        document.getElementById('newquot-modal-overlay').style.display = 'none';
        document.getElementById('newquot-invoice-master-form').reset();
        document.getElementById('newquot-modal-items-rows').replaceChildren();
        window.calculateDynamicQuotationTotal?.();
        const frame = document.getElementById('main-content-viewport') || document.querySelector('iframe[name="content-frame"]');
        if (frame) frame.src = '/quotations';
        if (typeof setActiveSidebarItem === 'function') setActiveSidebarItem('/quotations');
      } catch (error) { console.error('Quotation saved, but view refresh failed:', error); }
      alert(`Success! Quotation Saved as No: ${savedNumber}`);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeQuotationSave);
  else initializeQuotationSave();
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

// New Customer Order dates, delivery quantities, status and item editor.
(function(){
 function initializeCO(){
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
    window.forceResetModalLock?.('newco-modal-overlay');
    if(typeof closeAppModal==='function')closeAppModal('newco-modal-overlay');
    modal.style.display='none';if(typeof lockSidebarAndRefresh==='function')lockSidebarAndRefresh(false);
    form.reset();lines=[];body.replaceChildren();coRequestId='';closeItem();
    if(typeof setActiveSidebarItem==='function')setActiveSidebarItem('/customerorders');
    const menu=document.getElementById('menu-customerorders'),button=document.getElementById('btn-customerorders');
    if(button&&(!menu||menu.style.display!=='block'))button.click();document.getElementById('view-customerorders')?.click();
    const frame=document.getElementById('main-content-viewport')||document.querySelector('iframe[name="content-frame"]');if(frame)frame.src='/customerorders';
   }catch(error){console.error('Customer Order saved, but view refresh failed:',error);}
   alert('Success! Customer Order saved as No: '+allocatedNumber);
  });

  // A cancelled/closed New CO must not leave model rows behind after form reset.
  new MutationObserver(()=>{if(modal.style.display==='none'){lines=[];coRequestId='';body.replaceChildren();closeItem();}}).observe(modal,{attributes:true,attributeFilter:['style']});
  editor();colour();onOpen();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initializeCO);else initializeCO();
})();

// Shared modal autocomplete keyboard navigation (customer, product and product code).
(function installModalAutocompleteKeys(){
 if(window.__erpAutocompleteKeysInstalled)return;window.__erpAutocompleteKeysInstalled=true;
 const pairs=[['global-customer','.global-autocomplete-results'],['global-products','.global-product-autocomplete-results'],['global-item-code','.global-item-code-autocomplete-results']];
 const states=new WeakMap();let serial=0;
 function getState(input){
  const pair=pairs.find(([name])=>input.classList?.contains(name));if(!pair)return null;
  const modal=input.closest('.global-modal');const list=modal?.querySelector(pair[1])||states.get(input)?.list;if(!list)return null;
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

// New Customer master save.
(function(){function initNewCustomer(){
 const modal=document.getElementById('newcust-modal-overlay'),form=document.getElementById('newcust-master-form'),button=document.getElementById('btn-save-newcust');if(!modal||!form||!button)return;
 let saving=false;const field=name=>document.getElementById('newcust-'+name);
 form.addEventListener('submit',event=>{event.preventDefault();button.click();});
 button.addEventListener('click',async()=>{
  if(saving)return;
  for(const[name,label]of [['customer','Name'],['address','Address'],['emirate','Emirate']])if(!field(name).value.trim()){alert(label+' is required.');field(name).focus();return;}
  const mapping={custname:'customer',postbox:'postbox',custaddress:'address',emirate:'emirate',VatID:'vat-no',contact:'contact-person',phone:'contact-number',mobile:'mobile-number',paymentterm:'payment-terms',email:'email'};
  const payload=Object.fromEntries(Object.entries(mapping).map(([key,name])=>[key,field(name)?.value.trim()||'N/A']));
  saving=true;button.disabled=true;button.innerHTML='<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Saving…';const cancel=[...modal.querySelectorAll('.btn-cancel')];cancel.forEach(b=>b.disabled=true);
  try{
   const response=await fetch('/api/save-newcustomer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}),data=await response.json();if(!response.ok||!data.success)throw Error(data.error||'Could not save customer.');
   window.forceResetModalLock?.('newcust-modal-overlay');if(typeof closeAppModal==='function')closeAppModal('newcust-modal-overlay');modal.style.display='none';if(typeof lockSidebarAndRefresh==='function')lockSidebarAndRefresh(false);form.reset();
   if(typeof setActiveSidebarItem==='function')setActiveSidebarItem('/customers');
   const menu=document.getElementById('menu-clients'),toggle=document.getElementById('btn-clients');if(toggle&&(!menu||menu.style.display!=='block'))toggle.click();
   const link=document.querySelector('#menu-clients a[href="/customers"]');link?.click();const frame=document.getElementById('main-content-viewport')||document.querySelector('iframe[name="content-frame"]');if(frame)frame.src='/customers';alert(data.message||'Customer saved successfully.');
  }catch(error){alert(error.message);}
  finally{saving=false;button.disabled=false;button.textContent='Save';cancel.forEach(b=>b.disabled=false);}
 });
}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initNewCustomer);else initNewCustomer();})();

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

// Floating suggestions for New Customer; existing click handlers still populate fields.
(function(){function initCustomerSearchPopup(){
 const modal=document.getElementById('newcust-modal-overlay'),input=document.getElementById('newcust-customer'),list=document.getElementById('newcust-autocomplete-results');if(!modal||!input||!list)return;
 const home=list.parentElement;let timer=null,sequence=0;
 function hide(){clearTimeout(timer);sequence++;list.classList.add('d-none');input.setAttribute('aria-expanded','false');if(list.parentElement!==home)home.appendChild(list);}
 function place(){if(list.classList.contains('d-none'))return;const r=input.getBoundingClientRect(),v=window.visualViewport,top=v?.offsetTop??0,bottom=top+(v?.height??innerHeight),below=bottom-r.bottom-8,above=r.top-top-8,up=below<120&&above>below,h=Math.max(32,Math.min(220,up?above:below));for(const[k,val]of Object.entries({position:'fixed',left:Math.max(4,r.left)+'px',right:'auto',width:Math.min(Math.max(r.width,250),innerWidth-r.left-8)+'px','max-height':h+'px','z-index':'1000002',margin:'0'}))list.style.setProperty(k,val,'important');list.style.setProperty('top',(up?Math.max(top+4,r.top-Math.min(h,list.scrollHeight)-3):r.bottom+3)+'px','important');}
 new MutationObserver(()=>{if(list.classList.contains('d-none')){if(list.parentElement!==home)home.appendChild(list);}else{if(list.parentElement!==document.body)document.body.appendChild(list);place();input.setAttribute('aria-expanded','true');}}).observe(list,{attributes:true,attributeFilter:['class'],childList:true});
 input.addEventListener('input',()=>{hide();const query=input.value.trim(),request=sequence;if(!query)return;timer=setTimeout(async()=>{try{const staging=document.createElement('ul');await handleCustomerSearch(query,modal,staging);if(request!==sequence||document.activeElement!==input||modal.style.display!=='flex')return;list.replaceChildren(...staging.childNodes);list.classList.toggle('d-none',!list.children.length);}catch(error){console.error('Customer search failed:',error);if(request===sequence)hide();}},300);});
 document.addEventListener('pointerdown',e=>{if(e.target!==input&&!list.contains(e.target))hide();});list.addEventListener('click',e=>{if(e.target.closest('li'))hide();});input.addEventListener('keydown',e=>{if(e.key==='Escape'||e.key==='Tab')hide();});document.addEventListener('scroll',e=>{if(e.target!==list)place();},true);window.addEventListener('resize',place);window.visualViewport?.addEventListener('resize',place);new MutationObserver(()=>{if(modal.style.display==='none')hide();}).observe(modal,{attributes:true,attributeFilter:['style']});
}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initCustomerSearchPopup);else initCustomerSearchPopup();})();
