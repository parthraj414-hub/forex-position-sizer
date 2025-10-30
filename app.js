// ============================================
// FOREX POSITION SIZING CALCULATOR
// ============================================

// State Management (In-memory only - no localStorage)
const state = {
    theme: 'dark',
    currentRR: '1:2',
    lastInputs: {},
    livePrices: {
        EURUSD: 1.0850,
        USDJPY: 149.50,
        GBPUSD: 1.2145,
        USDCHF: 0.8850,
        USDCAD: 1.3550,
        AUDUSD: 0.6520,
        NZDUSD: 0.5980
    }
};

// Motivational Quotes
const quotes = [
    "Discipline is the best strategy.",
    "Risk less, trade longer.",
    "Winners manage risk, losers avoid it.",
    "The market rewards patience and punishes greed.",
    "Your edge is in your risk management.",
    "Plan the trade, trade the plan.",
    "Capital preservation comes first.",
    "Small risks, big rewards."
];

// Currency Symbols
const currencySymbols = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥',
    CHF: 'CHF', AUD: 'A$', NZD: 'NZ$', CAD: 'C$'
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    updateLivePrices();
    setInterval(updateLivePrices, 30000); // Update every 30 seconds
    
    // Auto-focus first input
    setTimeout(() => {
        const firstInput = document.getElementById('accountBalance');
        if (firstInput) firstInput.focus();
    }, 300);
});

function initializeApp() {
    // Set initial theme
    document.documentElement.setAttribute('data-theme', state.theme);
    updateThemeIcon();
    
    // Show random quote
    updateQuote();
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Theme toggle with animation
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Get Started button - smooth scroll
    document.getElementById('getStartedBtn').addEventListener('click', () => {
        document.getElementById('calculatorSection').scrollIntoView({ behavior: 'smooth' });
    });
    
    // Account currency change
    document.getElementById('accountCurrency').addEventListener('change', (e) => {
        updateCurrencyPrefix(e.target.value);
    });
    
    // Risk slider sync
    const riskSlider = document.getElementById('riskSlider');
    const riskPercent = document.getElementById('riskPercent');
    
    riskSlider.addEventListener('input', (e) => {
        riskPercent.value = e.target.value;
    });
    
    riskPercent.addEventListener('input', (e) => {
        const value = Math.min(10, Math.max(0.1, parseFloat(e.target.value) || 0.1));
        e.target.value = value;
        riskSlider.value = value;
    });
    
    // R:R Ratio buttons
    document.querySelectorAll('.rr-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.rr-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const ratio = e.target.getAttribute('data-ratio');
            state.currentRR = ratio;
            
            const customInput = document.getElementById('customRR');
            if (ratio === 'custom') {
                customInput.style.display = 'block';
            } else {
                customInput.style.display = 'none';
            }
        });
    });
    
    // Calculate button
    document.getElementById('calculateBtn').addEventListener('click', calculatePositionSize);
    
    // Copy results button
    document.getElementById('copyResultsBtn').addEventListener('click', copyResults);
    
    // Refresh quote button
    document.getElementById('refreshQuote').addEventListener('click', updateQuote);
    
    // Reset button
    document.getElementById('resetBtn').addEventListener('click', resetCalculator);
    
    // Tooltip functionality
    setupTooltips();
}

// ============================================
// THEME MANAGEMENT
// ============================================

function toggleTheme() {
    const toggle = document.getElementById('themeToggle');
    toggle.classList.add('rotating');
    
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);
    updateThemeIcon();
    
    setTimeout(() => {
        toggle.classList.remove('rotating');
    }, 600);
}

function updateThemeIcon() {
    const icon = document.querySelector('.theme-icon');
    icon.textContent = state.theme === 'dark' ? '☀️' : '🌙';
}

// ============================================
// UI UPDATES
// ============================================

function updateCurrencyPrefix(currency) {
    const prefix = document.getElementById('currencyPrefix');
    prefix.textContent = currencySymbols[currency] || '$';
}

function updateQuote() {
    const quoteText = document.getElementById('quoteText');
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    
    quoteText.style.opacity = '0';
    setTimeout(() => {
        quoteText.textContent = randomQuote;
        quoteText.style.opacity = '1';
    }, 200);
}

// ============================================
// LIVE PRICES (SIMULATED)
// ============================================

function updateLivePrices() {
    // Store old prices for comparison
    const oldPrices = {
        EURUSD: state.livePrices.EURUSD,
        USDJPY: state.livePrices.USDJPY,
        GBPUSD: state.livePrices.GBPUSD
    };
    
    // Simulate live price updates with small random changes
    state.livePrices.EURUSD += (Math.random() - 0.5) * 0.001;
    state.livePrices.USDJPY += (Math.random() - 0.5) * 0.1;
    state.livePrices.GBPUSD += (Math.random() - 0.5) * 0.001;
    
    // Update display with animations
    updatePriceWithAnimation('priceEURUSD', state.livePrices.EURUSD, oldPrices.EURUSD, 4);
    updatePriceWithAnimation('priceUSDJPY', state.livePrices.USDJPY, oldPrices.USDJPY, 2);
    updatePriceWithAnimation('priceGBPUSD', state.livePrices.GBPUSD, oldPrices.GBPUSD, 4);
}

function updatePriceWithAnimation(elementId, newPrice, oldPrice, decimals) {
    const element = document.getElementById(elementId);
    element.textContent = newPrice.toFixed(decimals);
    
    // Add color animation based on price movement
    element.classList.remove('price-up', 'price-down');
    if (newPrice > oldPrice) {
        element.classList.add('price-up');
    } else if (newPrice < oldPrice) {
        element.classList.add('price-down');
    }
    
    // Remove class after animation
    setTimeout(() => {
        element.classList.remove('price-up', 'price-down');
    }, 500);
}

// ============================================
// PIP VALUE CALCULATION
// ============================================

function getPipValue(pair, accountCurrency, lotSize = 1) {
    // Standard lot = 100,000 units
    // Mini lot = 10,000 units
    // Micro lot = 1,000 units
    // We'll use standard lot (1.0 = 100,000 units)
    
    const contractSize = 100000 * lotSize;
    
    // For Gold (XAU/USD)
    if (pair === 'XAUUSD') {
        // Gold: 1 pip = $0.01 per troy ounce, contract size typically 100 oz
        const pipValue = 1.0; // $1 per 0.01 movement for 1 lot
        return convertToAccountCurrency(pipValue, 'USD', accountCurrency);
    }
    
    // Get quote currency
    const quoteCurrency = pair.substring(3, 6);
    
    // For JPY pairs, pip is 0.01 (2 decimal places)
    // For others, pip is 0.0001 (4 decimal places)
    const pipSize = quoteCurrency === 'JPY' ? 0.01 : 0.0001;
    
    // Pip value in quote currency
    let pipValueQuote = contractSize * pipSize;
    
    // Convert to account currency
    if (quoteCurrency === accountCurrency) {
        return pipValueQuote;
    }
    
    // Need to convert from quote currency to account currency
    return convertToAccountCurrency(pipValueQuote, quoteCurrency, accountCurrency);
}

function convertToAccountCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;
    
    // Try direct conversion pair
    const directPair = fromCurrency + toCurrency;
    if (state.livePrices[directPair]) {
        return amount * state.livePrices[directPair];
    }
    
    // Try inverse pair
    const inversePair = toCurrency + fromCurrency;
    if (state.livePrices[inversePair]) {
        return amount / state.livePrices[inversePair];
    }
    
    // Use USD as intermediary
    let amountInUSD = amount;
    
    // Convert from -> USD
    if (fromCurrency !== 'USD') {
        const fromToUSD = fromCurrency + 'USD';
        const USDToFrom = 'USD' + fromCurrency;
        
        if (state.livePrices[fromToUSD]) {
            amountInUSD = amount * state.livePrices[fromToUSD];
        } else if (state.livePrices[USDToFrom]) {
            amountInUSD = amount / state.livePrices[USDToFrom];
        }
    }
    
    // Convert USD -> to
    if (toCurrency === 'USD') {
        return amountInUSD;
    }
    
    const USDToTo = 'USD' + toCurrency;
    const toToUSD = toCurrency + 'USD';
    
    if (state.livePrices[USDToTo]) {
        return amountInUSD * state.livePrices[USDToTo];
    } else if (state.livePrices[toToUSD]) {
        return amountInUSD / state.livePrices[toToUSD];
    }
    
    // Fallback: assume 1:1 (should not happen with proper data)
    return amount;
}

// ============================================
// POSITION SIZE CALCULATION
// ============================================

function calculatePositionSize() {
    // Add progress glow animation
    const btn = document.getElementById('calculateBtn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoader = btn.querySelector('.btn-loader');
    
    btn.classList.add('calculating');
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';
    
    // Simulate calculation delay for better UX
    setTimeout(() => {
        performCalculation();
        
        // Reset button state
        btn.classList.remove('calculating');
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }, 500);
}

function performCalculation() {
    // Get inputs
    const accountBalance = parseFloat(document.getElementById('accountBalance').value);
    const accountCurrency = document.getElementById('accountCurrency').value;
    const riskPercent = parseFloat(document.getElementById('riskPercent').value);
    const currencyPair = document.getElementById('currencyPair').value;
    const stopLossPips = parseFloat(document.getElementById('stopLoss').value);
    
    // Validation
    if (!accountBalance || accountBalance <= 0) {
        alert('Please enter a valid account balance.');
        return;
    }
    
    if (!riskPercent || riskPercent <= 0 || riskPercent > 10) {
        alert('Risk percentage must be between 0.1% and 10%.');
        return;
    }
    
    if (!stopLossPips || stopLossPips <= 0) {
        alert('Please enter a valid stop loss in pips.');
        return;
    }
    
    // Calculate risk amount in account currency
    const riskAmount = accountBalance * (riskPercent / 100);
    
    // Calculate pip value for 1 standard lot
    const pipValuePerLot = getPipValue(currencyPair, accountCurrency, 1);
    
    // Calculate lot size
    // Lot Size = Risk Amount / (Stop Loss in Pips × Pip Value per Lot)
    const lotSize = riskAmount / (stopLossPips * pipValuePerLot);
    
    // Get R:R ratio
    let rrRatio = state.currentRR;
    if (rrRatio === 'custom') {
        rrRatio = document.getElementById('customRR').value || '1:2';
    }
    
    const [risk, reward] = rrRatio.split(':').map(Number);
    const rewardMultiplier = reward / risk;
    
    // Calculate potential profit and loss
    const potentialLoss = riskAmount;
    const potentialProfit = riskAmount * rewardMultiplier;
    
    // Display results
    displayResults({
        lotSize: lotSize.toFixed(2),
        moneyRisk: formatCurrency(riskAmount, accountCurrency),
        potentialProfit: formatCurrency(potentialProfit, accountCurrency),
        potentialLoss: formatCurrency(potentialLoss, accountCurrency),
        riskPercent: riskPercent.toFixed(1),
        rrRatio: rrRatio,
        risk: risk,
        reward: reward
    });
    
    // Show results card with animation
    const resultsCard = document.getElementById('resultsCard');
    resultsCard.style.display = 'block';
    
    // Show success indicator
    const successIndicator = document.getElementById('successIndicator');
    successIndicator.style.display = 'flex';
    setTimeout(() => {
        successIndicator.style.display = 'none';
    }, 2000);
    
    document.getElementById('quoteSection').style.display = 'block';
    
    // Smooth scroll to results
    setTimeout(() => {
        document.getElementById('resultsCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

function displayResults(results) {
    // Update result values
    document.getElementById('lotSize').textContent = results.lotSize;
    document.getElementById('moneyRisk').textContent = results.moneyRisk;
    document.getElementById('potentialProfit').textContent = results.potentialProfit;
    document.getElementById('potentialLoss').textContent = results.potentialLoss;
    
    // Update R:R visual bar with animation
    const totalParts = results.risk + results.reward;
    const riskWidth = (results.risk / totalParts) * 100;
    const rewardWidth = (results.reward / totalParts) * 100;
    
    // Reset to 0 then animate
    const rrBarRisk = document.getElementById('rrBarRisk');
    const rrBarReward = document.getElementById('rrBarReward');
    
    rrBarRisk.style.width = '0%';
    rrBarReward.style.width = '0%';
    
    setTimeout(() => {
        rrBarRisk.style.width = riskWidth + '%';
        rrBarReward.style.width = rewardWidth + '%';
    }, 100);
    
    // Update risk progress bar with animation
    const riskPercent = parseFloat(results.riskPercent);
    document.getElementById('riskProgressPercent').textContent = riskPercent.toFixed(1) + '%';
    
    const progressFill = document.getElementById('riskProgressFill');
    progressFill.style.width = '0%';
    
    setTimeout(() => {
        progressFill.style.width = Math.min(riskPercent * 10, 100) + '%';
    }, 100);
}

function formatCurrency(amount, currency) {
    const symbol = currencySymbols[currency] || '$';
    return symbol + amount.toFixed(2);
}

// ============================================
// COPY RESULTS
// ============================================

function copyResults() {
    const lotSize = document.getElementById('lotSize').textContent;
    const moneyRisk = document.getElementById('moneyRisk').textContent;
    const potentialProfit = document.getElementById('potentialProfit').textContent;
    const potentialLoss = document.getElementById('potentialLoss').textContent;
    
    const text = `Position Size: ${lotSize} lots\nMoney at Risk: ${moneyRisk}\nPotential Profit: ${potentialProfit}\nPotential Loss: ${potentialLoss}`;
    
    // Create temporary textarea for copying
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        
        // Visual feedback
        const btn = document.getElementById('copyResultsBtn');
        const originalText = btn.textContent;
        btn.textContent = '✅ Copied!';
        btn.style.background = 'linear-gradient(135deg, #00D9A5, #00B386)';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
        alert('Failed to copy results. Please try again.');
    }
    
    document.body.removeChild(textarea);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Initialize prices for cross pairs (using triangulation)
function initializeCrossPairs() {
    // Calculate cross pair rates from major pairs
    state.livePrices.EURGBP = state.livePrices.EURUSD / state.livePrices.GBPUSD;
    state.livePrices.EURJPY = state.livePrices.EURUSD * state.livePrices.USDJPY;
    state.livePrices.GBPJPY = state.livePrices.GBPUSD * state.livePrices.USDJPY;
    state.livePrices.AUDCAD = state.livePrices.AUDUSD * state.livePrices.USDCAD;
    state.livePrices.AUDJPY = state.livePrices.AUDUSD * state.livePrices.USDJPY;
    state.livePrices.CADJPY = state.livePrices.USDJPY / state.livePrices.USDCAD;
    state.livePrices.NZDCAD = state.livePrices.NZDUSD * state.livePrices.USDCAD;
    state.livePrices.NZDJPY = state.livePrices.NZDUSD * state.livePrices.USDJPY;
    state.livePrices.CADCHF = state.livePrices.USDCHF / state.livePrices.USDCAD;
    state.livePrices.EURCHF = state.livePrices.EURUSD * state.livePrices.USDCHF;
    state.livePrices.AUDNZD = state.livePrices.AUDUSD / state.livePrices.NZDUSD;
    state.livePrices.CHFJPY = state.livePrices.USDJPY / state.livePrices.USDCHF;
}

// Initialize cross pairs on load
initializeCrossPairs();

// Update cross pairs when live prices update
setInterval(initializeCrossPairs, 30000);

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

function handleKeyboardShortcuts(e) {
    // Enter = Calculate
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
        const activeElement = document.activeElement;
        // Only if not in a button
        if (activeElement.tagName !== 'BUTTON') {
            e.preventDefault();
            calculatePositionSize();
        }
    }
    
    // R = Reset
    if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey) {
        const activeElement = document.activeElement;
        // Only if not typing in an input
        if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            resetCalculator();
        }
    }
}

// ============================================
// RESET CALCULATOR
// ============================================

function resetCalculator() {
    // Animate reset button
    const resetBtn = document.getElementById('resetBtn');
    const resetIcon = resetBtn.querySelector('.reset-icon');
    resetIcon.style.transform = 'rotate(360deg)';
    
    setTimeout(() => {
        resetIcon.style.transform = 'rotate(0deg)';
    }, 600);
    
    // Reset form inputs
    document.getElementById('accountBalance').value = '';
    document.getElementById('accountCurrency').value = 'USD';
    document.getElementById('riskSlider').value = 1;
    document.getElementById('riskPercent').value = 1;
    document.getElementById('currencyPair').value = 'EURUSD';
    document.getElementById('stopLoss').value = '';
    document.getElementById('entryPrice').value = '';
    document.getElementById('customRR').value = '';
    document.getElementById('customRR').style.display = 'none';
    
    // Reset R:R buttons
    document.querySelectorAll('.rr-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-ratio') === '1:1') {
            btn.classList.add('active');
        }
    });
    
    state.currentRR = '1:1';
    
    // Update currency prefix
    updateCurrencyPrefix('USD');
    
    // Hide results
    document.getElementById('resultsCard').style.display = 'none';
    document.getElementById('quoteSection').style.display = 'none';
    
    // Auto-focus first input
    setTimeout(() => {
        document.getElementById('accountBalance').focus();
    }, 100);
}

// ============================================
// TOOLTIP FUNCTIONALITY
// ============================================

function setupTooltips() {
    const infoIcons = document.querySelectorAll('.info-icon');
    const tooltipPopup = document.getElementById('tooltipPopup');
    
    infoIcons.forEach(icon => {
        icon.addEventListener('mouseenter', (e) => {
            const tooltipText = icon.getAttribute('data-tooltip');
            if (tooltipText) {
                tooltipPopup.textContent = tooltipText;
                tooltipPopup.style.display = 'block';
                positionTooltip(e, tooltipPopup);
            }
        });
        
        icon.addEventListener('mousemove', (e) => {
            positionTooltip(e, tooltipPopup);
        });
        
        icon.addEventListener('mouseleave', () => {
            tooltipPopup.style.display = 'none';
        });
        
        // Touch support for mobile
        icon.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const tooltipText = icon.getAttribute('data-tooltip');
            if (tooltipText) {
                tooltipPopup.textContent = tooltipText;
                tooltipPopup.style.display = 'block';
                positionTooltip(e.touches[0], tooltipPopup);
                
                // Hide after 3 seconds
                setTimeout(() => {
                    tooltipPopup.style.display = 'none';
                }, 3000);
            }
        });
    });
}

function positionTooltip(e, tooltip) {
    const offset = 15;
    let left = e.clientX + offset;
    let top = e.clientY + offset;
    
    // Check if tooltip would go off screen
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (left + tooltipRect.width > viewportWidth) {
        left = e.clientX - tooltipRect.width - offset;
    }
    
    if (top + tooltipRect.height > viewportHeight) {
        top = e.clientY - tooltipRect.height - offset;
    }
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
}