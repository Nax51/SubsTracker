// 訂閱續期通知网站 - 基於CloudFlare Workers (完全優化版)

// 定義HTML模板
const loginPage = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>訂閱管理系統</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
  <style>
    .login-container {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .login-box {
      backdrop-filter: blur(8px);
      background-color: rgba(255, 255, 255, 0.9);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    }
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      transition: all 0.3s;
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }
    .input-field {
      transition: all 0.3s;
      border: 1px solid #e2e8f0;
    }
    .input-field:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.25);
    }
    
    /* 手機響應式優化 */
    @media (max-width: 640px) {
      .login-box {
        margin: 1rem;
        padding: 1.5rem;
      }
      
      .table-container {
        margin: 0 -1rem;
      }
      
      .toast {
        right: 10px;
        left: 10px;
        transform: translateY(-100px);
        transition: transform 0.3s ease;
      }
      
      .toast.show {
        transform: translateY(0);
      }
      
      .modal-content {
        max-height: 90vh;
        margin: 1rem;
      }
    }

    /* 表格行動版優化 */
    @media (max-width: 768px) {
      .table-container table {
        font-size: 0.875rem;
      }
      
      .table-container th,
      .table-container td {
        padding: 0.5rem 0.75rem;
      }
      
      .action-buttons {
        flex-direction: column;
        gap: 0.25rem;
      }
    }
  </style>
</head>
<body class="login-container flex items-center justify-center">
  <div class="login-box p-8 rounded-xl w-full max-w-md">
    <div class="text-center mb-8">
      <h1 class="text-2xl font-bold text-gray-800"><i class="fas fa-calendar-check mr-2"></i>訂閱管理系統</h1>
      <p class="text-gray-600 mt-2">登錄管理您的訂閱提醒</p>
    </div>
    
    <form id="loginForm" class="space-y-6">
      <div>
        <label for="username" class="block text-sm font-medium text-gray-700 mb-1">
          <i class="fas fa-user mr-2"></i>用户名
        </label>
        <input type="text" id="username" name="username" required
          class="input-field w-full px-4 py-3 rounded-lg text-gray-700 focus:outline-none">
      </div>
      
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
          <i class="fas fa-lock mr-2"></i>密碼
        </label>
        <input type="password" id="password" name="password" required
          class="input-field w-full px-4 py-3 rounded-lg text-gray-700 focus:outline-none">
      </div>
      
      <button type="submit" 
        class="btn-primary w-full py-3 rounded-lg text-white font-medium focus:outline-none">
        <i class="fas fa-sign-in-alt mr-2"></i>登錄
      </button>
      
      <div id="errorMsg" class="text-red-500 text-center"></div>
    </form>
  </div>
  
  <script>
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      const button = e.target.querySelector('button');
      const originalContent = button.innerHTML;
      button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>登錄中...';
      button.disabled = true;
      
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
          window.location.href = '/admin';
        } else {
          document.getElementById('errorMsg').textContent = result.message || '用户名或密碼錯誤';
          button.innerHTML = originalContent;
          button.disabled = false;
        }
      } catch (error) {
        document.getElementById('errorMsg').textContent = '發生錯誤，請稍後再試';
        button.innerHTML = originalContent;
        button.disabled = false;
      }
    });
  </script>
</body>
</html>
`;

const adminPage = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>訂閱管理系統</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
  <style>
    .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); transition: all 0.3s; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); }
    .btn-danger { background: linear-gradient(135deg, #f87171 0%, #dc2626 100%); transition: all 0.3s; }
    .btn-danger:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); }
    .btn-success { background: linear-gradient(135deg, #34d399 0%, #059669 100%); transition: all 0.3s; }
    .btn-success:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); }
    .btn-warning { background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%); transition: all 0.3s; }
    .btn-warning:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); }
    .btn-info { background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%); transition: all 0.3s; }
    .btn-info:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); }
    .table-container { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
    .modal-container { backdrop-filter: blur(8px); }
    .readonly-input { background-color: #f8fafc; border-color: #e2e8f0; cursor: not-allowed; }
    .error-message { font-size: 0.875rem; margin-top: 0.25rem; display: none; }
    .error-message.show { display: block; }
    
    /* Toast 样式 */
    .toast {
      position: fixed; top: 20px; right: 20px; padding: 12px 20px; border-radius: 8px;
      color: white; font-weight: 500; z-index: 1000; transform: translateX(400px);
      transition: all 0.3s ease-in-out; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .toast.show { transform: translateX(0); }
    .toast.success { background-color: #10b981; }
    .toast.error { background-color: #ef4444; }
    .toast.info { background-color: #3b82f6; }
    .toast.warning { background-color: #f59e0b; }
  </style>
</head>
<body class="bg-gray-100 min-h-screen">
  <div id="toast-container"></div>

  <nav class="bg-white shadow-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <i class="fas fa-calendar-check text-indigo-600 text-2xl mr-2"></i>
          <span class="font-bold text-xl text-gray-800">訂閱管理系統</span>
        </div>
        <div class="flex items-center space-x-4">
          <a href="/admin" class="text-indigo-600 border-b-2 border-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-list mr-1"></i>訂閱列表
          </a>
          <a href="/admin/config" class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-cog mr-1"></i>系统配置
          </a>
          <a href="/api/logout" class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-sign-out-alt mr-1"></i>退出登錄
          </a>
        </div>
      </div>
    </div>
  </nav>
  
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">訂閱列表</h2>
      <div class="flex space-x-2">
        <button id="addSubscriptionBtn" class="btn-primary text-white px-4 py-2 rounded-md text-sm font-medium flex items-center">
          <i class="fas fa-plus mr-2"></i>添加新訂閱
        </button>
      </div>
    </div>
    
    <div class="table-container bg-white rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名稱</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">類型</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              到期時間 <i class="fas fa-sort-up ml-1 text-indigo-500" title="按到期時間升序排列"></i>
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">價格</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">提醒設置</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">狀態</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody id="subscriptionsBody" class="bg-white divide-y divide-gray-200">
        </tbody>
      </table>
      </div>
    </div>
  </div>

  <!-- 添加/編輯訂閱的模態框 -->
  <div id="subscriptionModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 modal-container hidden flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-2 sm:mx-4 max-h-screen overflow-y-auto">
      <div class="bg-gray-50 px-6 py-4 border-b border-gray-200 rounded-t-lg">
        <div class="flex items-center justify-between">
          <h3 id="modalTitle" class="text-lg font-medium text-gray-900">添加新訂閱</h3>
          <button id="closeModal" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
      </div>
      
      <form id="subscriptionForm" class="p-6 space-y-6">
        <input type="hidden" id="subscriptionId">
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">訂閱名稱 *</label>
            <input type="text" id="name" required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
            <div class="error-message text-red-500"></div>
          </div>
          
          <div>
            <label for="customType" class="block text-sm font-medium text-gray-700 mb-1">訂閱類型</label>
            <input type="text" id="customType" placeholder="例如：流媒体、雲服務、軟件等"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
            <div class="error-message text-red-500"></div>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="price" class="block text-sm font-medium text-gray-700 mb-1">價格</label>
            <input type="number" id="price" step="0.01" min="0" placeholder="0.00"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
            <div class="error-message text-red-500"></div>
          </div>
          
          <div>
            <label for="currency" class="block text-sm font-medium text-gray-700 mb-1">貨幣</label>
            <select id="currency"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
              <option value="USD">美元 (USD)</option>
              <option value="EUR">歐元 (EUR)</option>
              <option value="TWD" selected>台幣 (TWD)</option>
              <option value="CNY">人民幣 (CNY)</option>
              <option value="JPY">日圓 (JPY)</option>
            </select>
            <div id="exchangeRateDisplay" class="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700" style="display: none;">
              <i class="fas fa-exchange-alt mr-1"></i>
              <span id="exchangeRateText">等待匯率資料...</span>
            </div>
            <div class="error-message text-red-500"></div>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label for="startDate" class="block text-sm font-medium text-gray-700 mb-1">開始日期</label>
            <input type="date" id="startDate"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
            <div class="error-message text-red-500"></div>
          </div>
          
          <div>
            <label for="periodValue" class="block text-sm font-medium text-gray-700 mb-1">周期數值 *</label>
            <input type="number" id="periodValue" min="1" value="1" required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
            <div class="error-message text-red-500"></div>
          </div>
          
          <div>
            <label for="periodUnit" class="block text-sm font-medium text-gray-700 mb-1">周期单位 *</label>
            <select id="periodUnit" required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
              <option value="day">天</option>
              <option value="month" selected>月</option>
              <option value="year">年</option>
            </select>
            <div class="error-message text-red-500"></div>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="expiryDate" class="block text-sm font-medium text-gray-700 mb-1">到期日期 *</label>
            <input type="date" id="expiryDate" required
              class="readonly-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none">
            <div class="error-message text-red-500"></div>
          </div>
          
          <div class="flex items-end">
            <button type="button" id="calculateExpiryBtn" 
              class="btn-primary text-white px-4 py-2 rounded-md text-sm font-medium h-10">
              <i class="fas fa-calculator mr-2"></i>自動计算到期日期
            </button>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="reminderDays" class="block text-sm font-medium text-gray-700 mb-1">提前提醒天數</label>
            <input type="number" id="reminderDays" min="0" value="7"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
            <p class="text-xs text-gray-500 mt-1">0 = 僅到期日当天提醒，1+ = 提前N天開始提醒</p>
            <div class="error-message text-red-500"></div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3">選項設置</label>
            <div class="space-y-2">
              <label class="inline-flex items-center">
                <input type="checkbox" id="isActive" checked 
                  class="form-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500">
                <span class="ml-2 text-sm text-gray-700">啟用訂閱</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" id="autoRenew" checked 
                  class="form-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500">
                <span class="ml-2 text-sm text-gray-700">自動續訂</span>
              </label>
            </div>
          </div>
        </div>
        
        <div>
          <label for="notes" class="block text-sm font-medium text-gray-700 mb-1">備注</label>
          <textarea id="notes" rows="3" placeholder="可添加相關備注信息..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"></textarea>
          <div class="error-message text-red-500"></div>
        </div>
        
        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button type="button" id="cancelBtn" 
            class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
            取消
          </button>
          <button type="submit" 
            class="btn-primary text-white px-4 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-save mr-2"></i>保存
          </button>
        </div>
      </form>
    </div>
  </div>

  <script>
    function showToast(message, type = 'success', duration = 3000) {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = 'toast ' + type;
      
      const icon = type === 'success' ? 'check-circle' :
                   type === 'error' ? 'exclamation-circle' :
                   type === 'warning' ? 'exclamation-triangle' : 'info-circle';
      
      toast.innerHTML = '<div class="flex items-center"><i class="fas fa-' + icon + ' mr-2"></i><span>' + message + '</span></div>';
      
      container.appendChild(toast);
      setTimeout(() => toast.classList.add('show'), 100);
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          if (container.contains(toast)) {
            container.removeChild(toast);
          }
        }, 300);
      }, duration);
    }

    function showFieldError(fieldId, message) {
      const field = document.getElementById(fieldId);
      const errorDiv = field.parentElement.querySelector('.error-message');
      if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
        field.classList.add('border-red-500');
      }
    }

    function clearFieldErrors() {
      document.querySelectorAll('.error-message').forEach(el => {
        el.classList.remove('show');
        el.textContent = '';
      });
      document.querySelectorAll('.border-red-500').forEach(el => {
        el.classList.remove('border-red-500');
      });
    }

    function validateForm() {
      clearFieldErrors();
      let isValid = true;

      const name = document.getElementById('name').value.trim();
      if (!name) {
        showFieldError('name', '請輸入訂閱名稱');
        isValid = false;
      }

      const periodValue = document.getElementById('periodValue').value;
      if (!periodValue || periodValue < 1) {
        showFieldError('periodValue', '周期數值必須大於0');
        isValid = false;
      }

      const expiryDate = document.getElementById('expiryDate').value;
      if (!expiryDate) {
        showFieldError('expiryDate', '請選擇到期日期');
        isValid = false;
      }

      const reminderDays = document.getElementById('reminderDays').value;
      if (reminderDays === '' || reminderDays < 0) {
        showFieldError('reminderDays', '提醒天數不能為負數');
        isValid = false;
      }

      return isValid;
    }

    // 匯率管理功能
    let exchangeRates = null;
    let baseCurrency = 'TWD'; // 預設顯示貨幣
    
    async function fetchExchangeRates() {
      try {
        const response = await fetch('/api/currency/rates');
        const data = await response.json();
        
        if (data.success) {
          exchangeRates = data.data;
          return exchangeRates;
        } else {
          console.error('獲取匯率失敗:', data.message);
          return null;
        }
      } catch (error) {
        console.error('獲取匯率錯誤:', error);
        return null;
      }
    }
    
    function convertCurrency(amount, fromCurrency, toCurrency) {
      if (!exchangeRates || !exchangeRates.rates) return null;
      if (fromCurrency === toCurrency) return amount;
      
      const rates = exchangeRates.rates;
      let convertedAmount;
      
      if (fromCurrency === 'USD') {
        convertedAmount = amount * rates[toCurrency];
      } else if (toCurrency === 'USD') {
        convertedAmount = amount / rates[fromCurrency];
      } else {
        // 先轉換到 USD，再轉換到目標貨幣
        const usdAmount = amount / rates[fromCurrency];
        convertedAmount = usdAmount * rates[toCurrency];
      }
      
      return parseFloat(convertedAmount.toFixed(2));
    }
    
    function formatPriceWithConversion(price, currency) {
      if (!price) return '未設定';
      
      const originalPrice = price.toFixed(2) + ' ' + currency;
      
      if (!exchangeRates || currency === baseCurrency) {
        return originalPrice;
      }
      
      const convertedPrice = convertCurrency(price, currency, baseCurrency);
      if (convertedPrice !== null) {
        return originalPrice + ' (≈ ' + convertedPrice.toFixed(2) + ' ' + baseCurrency + ')';
      }
      
      return originalPrice;
    }
    
    function updateExchangeRateDisplay() {
      const priceInput = document.getElementById('price');
      const currencySelect = document.getElementById('currency');
      const exchangeRateDisplay = document.getElementById('exchangeRateDisplay');
      const exchangeRateText = document.getElementById('exchangeRateText');
      
      if (!priceInput || !currencySelect || !exchangeRateDisplay || !exchangeRateText) {
        return;
      }
      
      const price = parseFloat(priceInput.value);
      const currency = currencySelect.value;
      
      if (!price || !currency || !exchangeRates) {
        exchangeRateDisplay.style.display = 'none';
        return;
      }
      
      if (currency === baseCurrency) {
        exchangeRateDisplay.style.display = 'none';
        return;
      }
      
      const convertedPrice = convertCurrency(price, currency, baseCurrency);
      if (convertedPrice !== null) {
        exchangeRateText.textContent = '約 ' + convertedPrice.toFixed(2) + ' ' + baseCurrency + ' (匯率: 1 ' + currency + ' = ' + (convertCurrency(1, currency, baseCurrency) || 0).toFixed(4) + ' ' + baseCurrency + ')';
        exchangeRateDisplay.style.display = 'block';
      } else {
        exchangeRateDisplay.style.display = 'none';
      }
    }

    // 獲取所有訂閱並按到期時間排序
    async function loadSubscriptions() {
      try {
        const tbody = document.getElementById('subscriptionsBody');
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><i class="fas fa-spinner fa-spin mr-2"></i>加載中...</td></tr>';
        
        // 先獲取匯率資料
        await fetchExchangeRates();
        
        const response = await fetch('/api/subscriptions');
        const data = await response.json();
        
        tbody.innerHTML = '';
        
        if (data.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-gray-500">沒有訂閱數據</td></tr>';
          return;
        }
        
        // 按到期時間升序排序（最早到期的在前）
        data.sort((a, b) => {
          const aExpiry = a.currentPlan?.expiryDate || a.expiryDate;
          const bExpiry = b.currentPlan?.expiryDate || b.expiryDate;
          return new Date(aExpiry) - new Date(bExpiry);
        });
        
        data.forEach(subscription => {
          const row = document.createElement('tr');
          row.className = subscription.isActive === false ? 'hover:bg-gray-50 bg-gray-100' : 'hover:bg-gray-50';
          
          const expiryDate = new Date(subscription.currentPlan?.expiryDate || subscription.expiryDate);
          const now = new Date();
          const daysDiff = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
          
          let statusHtml = '';
          if (!subscription.isActive) {
            statusHtml = '<span class="px-2 py-1 text-xs font-medium rounded-full text-white bg-gray-500"><i class="fas fa-pause-circle mr-1"></i>已停用</span>';
          } else if (daysDiff < 0) {
            statusHtml = '<span class="px-2 py-1 text-xs font-medium rounded-full text-white bg-red-500"><i class="fas fa-exclamation-circle mr-1"></i>已過期</span>';
          } else if (daysDiff <= (subscription.reminderDays || 7)) {
            statusHtml = '<span class="px-2 py-1 text-xs font-medium rounded-full text-white bg-yellow-500"><i class="fas fa-exclamation-triangle mr-1"></i>即將到期</span>';
          } else {
            statusHtml = '<span class="px-2 py-1 text-xs font-medium rounded-full text-white bg-green-500"><i class="fas fa-check-circle mr-1"></i>正常</span>';
          }
          
          let periodText = '';
          if (subscription.periodValue && subscription.periodUnit) {
            const unitMap = { day: '天', month: '月', year: '年' };
            periodText = subscription.periodValue + ' ' + (unitMap[subscription.periodUnit] || subscription.periodUnit);
          }
          
          const autoRenewIcon = subscription.autoRenew !== false ? 
            '<i class="fas fa-sync-alt text-blue-500 ml-1" title="自動續訂"></i>' : 
            '<i class="fas fa-ban text-gray-400 ml-1" title="不自動續訂"></i>';
          
          row.innerHTML = 
            '<td class="px-6 py-4 whitespace-nowrap">' + 
              '<div class="text-sm font-medium text-gray-900">' + subscription.name + '</div>' +
              (subscription.notes ? '<div class="text-xs text-gray-500">' + subscription.notes + '</div>' : '') +
            '</td>' +
            '<td class="px-6 py-4 whitespace-nowrap">' + 
              '<div class="text-sm text-gray-900">' + 
                '<i class="fas fa-tag mr-1"></i>' + (subscription.customType || '其他') + 
              '</div>' +
              (periodText ? '<div class="text-xs text-gray-500">周期: ' + periodText + autoRenewIcon + '</div>' : '') +
            '</td>' +
            '<td class="px-6 py-4 whitespace-nowrap">' + 
              '<div class="text-sm text-gray-900">' + new Date(subscription.currentPlan?.expiryDate || subscription.expiryDate).toLocaleDateString() + '</div>' +
              '<div class="text-xs text-gray-500">' + (daysDiff < 0 ? '已過期' + Math.abs(daysDiff) + '天' : '還剩' + daysDiff + '天') + '</div>' +
              ((subscription.currentPlan?.startDate || subscription.startDate) ? '<div class="text-xs text-gray-500">開始: ' + new Date(subscription.currentPlan?.startDate || subscription.startDate).toLocaleDateString() + '</div>' : '') +
            '</td>' +
            '<td class="px-6 py-4 whitespace-nowrap">' + 
              '<div class="text-sm text-gray-900">' + 
                '<i class="fas fa-dollar-sign mr-1"></i>' + 
                formatPriceWithConversion(subscription.currentPlan?.price || subscription.price, subscription.currentPlan?.currency || subscription.currency || 'TWD') + 
              '</div>' +
            '</td>' +
            '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + 
              '<div><i class="fas fa-bell mr-1"></i>提前' + (subscription.reminderDays || 0) + '天</div>' +
              (subscription.reminderDays === 0 ? '<div class="text-xs text-gray-500">僅到期日提醒</div>' : '') +
            '</td>' +
            '<td class="px-6 py-4 whitespace-nowrap">' + statusHtml + '</td>' +
            '<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">' +
              '<div class="flex flex-wrap gap-1 action-buttons">' +
                '<button class="edit btn-primary text-white px-2 py-1 rounded text-xs" data-id="' + subscription.id + '"><i class="fas fa-edit mr-1"></i>編輯</button>' +
                '<button class="test-notify btn-info text-white px-2 py-1 rounded text-xs" data-id="' + subscription.id + '"><i class="fas fa-paper-plane mr-1"></i>測試</button>' +
                '<button class="delete btn-danger text-white px-2 py-1 rounded text-xs" data-id="' + subscription.id + '"><i class="fas fa-trash-alt mr-1"></i>删除</button>' +
                (subscription.isActive ? 
                  '<button class="toggle-status btn-warning text-white px-2 py-1 rounded text-xs" data-id="' + subscription.id + '" data-action="deactivate"><i class="fas fa-pause-circle mr-1"></i>停用</button>' : 
                  '<button class="toggle-status btn-success text-white px-2 py-1 rounded text-xs" data-id="' + subscription.id + '" data-action="activate"><i class="fas fa-play-circle mr-1"></i>啟用</button>') +
              '</div>' +
            '</td>';
          
          tbody.appendChild(row);
        });
        
        document.querySelectorAll('.edit').forEach(button => {
          button.addEventListener('click', editSubscription);
        });
        
        document.querySelectorAll('.delete').forEach(button => {
          button.addEventListener('click', deleteSubscription);
        });
        
        document.querySelectorAll('.toggle-status').forEach(button => {
          button.addEventListener('click', toggleSubscriptionStatus);
        });

        document.querySelectorAll('.test-notify').forEach(button => {
          button.addEventListener('click', testSubscriptionNotification);
        });
      } catch (error) {
        console.error('加載訂閱失敗:', error);
        const tbody = document.getElementById('subscriptionsBody');
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-red-500"><i class="fas fa-exclamation-circle mr-2"></i>加載失敗，請刷新頁面重試</td></tr>';
        showToast('加載訂閱列表失敗', 'error');
      }
    }
    
    async function testSubscriptionNotification(e) {
        const button = e.target.tagName === 'BUTTON' ? e.target : e.target.parentElement;
        const id = button.dataset.id;
        const originalContent = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>';
        button.disabled = true;

        try {
            const response = await fetch('/api/subscriptions/' + id + '/test-notify', { method: 'POST' });
            const result = await response.json();
            if (result.success) {
                showToast(result.message || '測試通知已發送', 'success');
            } else {
                showToast(result.message || '測試通知發送失敗', 'error');
            }
        } catch (error) {
            console.error('測試通知失敗:', error);
            showToast('發送測試通知時發生錯誤', 'error');
        } finally {
            button.innerHTML = originalContent;
            button.disabled = false;
        }
    }
    
    async function toggleSubscriptionStatus(e) {
      const id = e.target.dataset.id || e.target.parentElement.dataset.id;
      const action = e.target.dataset.action || e.target.parentElement.dataset.action;
      const isActivate = action === 'activate';
      
      const button = e.target.tagName === 'BUTTON' ? e.target : e.target.parentElement;
      const originalContent = button.innerHTML;
      button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>' + (isActivate ? '啟用中...' : '停用中...');
      button.disabled = true;
      
      try {
        const response = await fetch('/api/subscriptions/' + id + '/toggle-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: isActivate })
        });
        
        if (response.ok) {
          showToast((isActivate ? '啟用' : '停用') + '成功', 'success');
          loadSubscriptions();
        } else {
          const error = await response.json();
          showToast((isActivate ? '啟用' : '停用') + '失敗: ' + (error.message || '未知錯誤'), 'error');
          button.innerHTML = originalContent;
          button.disabled = false;
        }
      } catch (error) {
        console.error((isActivate ? '啟用' : '停用') + '訂閱失敗:', error);
        showToast((isActivate ? '啟用' : '停用') + '失敗，請稍後再試', 'error');
        button.innerHTML = originalContent;
        button.disabled = false;
      }
    }
    
    document.getElementById('addSubscriptionBtn').addEventListener('click', async () => {
      document.getElementById('modalTitle').textContent = '添加新訂閱';
      document.getElementById('subscriptionModal').classList.remove('hidden');
      
      document.getElementById('subscriptionForm').reset();
      document.getElementById('subscriptionId').value = '';
      clearFieldErrors();
      
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('startDate').value = today;
      document.getElementById('reminderDays').value = '7';
      document.getElementById('isActive').checked = true;
      document.getElementById('autoRenew').checked = true;
      document.getElementById('price').value = '0';
      document.getElementById('currency').value = 'TWD';
      
      calculateExpiryDate();
      setupModalEventListeners();
      
      // 獲取匯率並更新顯示
      await fetchExchangeRates();
      updateExchangeRateDisplay();
    });
    
    function setupModalEventListeners() {
      document.getElementById('calculateExpiryBtn').removeEventListener('click', calculateExpiryDate);
      document.getElementById('calculateExpiryBtn').addEventListener('click', calculateExpiryDate);
      
      ['startDate', 'periodValue', 'periodUnit'].forEach(id => {
        const element = document.getElementById(id);
        element.removeEventListener('change', calculateExpiryDate);
        element.addEventListener('change', calculateExpiryDate);
      });
      
      // 添加價格和貨幣變更監聽器
      ['price', 'currency'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          element.removeEventListener('input', updateExchangeRateDisplay);
          element.removeEventListener('change', updateExchangeRateDisplay);
          element.addEventListener('input', updateExchangeRateDisplay);
          element.addEventListener('change', updateExchangeRateDisplay);
        }
      });
      
      document.getElementById('cancelBtn').addEventListener('click', () => {
        document.getElementById('subscriptionModal').classList.add('hidden');
      });
    }
    
    function calculateExpiryDate() {
      const startDate = document.getElementById('startDate').value;
      const periodValue = parseInt(document.getElementById('periodValue').value);
      const periodUnit = document.getElementById('periodUnit').value;
      
      if (!startDate || !periodValue || !periodUnit) {
        return;
      }
      
      const start = new Date(startDate);
      const expiry = new Date(start);
      
      if (periodUnit === 'day') {
        expiry.setDate(start.getDate() + periodValue);
      } else if (periodUnit === 'month') {
        expiry.setMonth(start.getMonth() + periodValue);
      } else if (periodUnit === 'year') {
        expiry.setFullYear(start.getFullYear() + periodValue);
      }
      
      document.getElementById('expiryDate').value = expiry.toISOString().split('T')[0];
    }
    
    document.getElementById('closeModal').addEventListener('click', () => {
      document.getElementById('subscriptionModal').classList.add('hidden');
    });
    
    document.getElementById('subscriptionModal').addEventListener('click', (event) => {
      if (event.target === document.getElementById('subscriptionModal')) {
        document.getElementById('subscriptionModal').classList.add('hidden');
      }
    });
    
    document.getElementById('subscriptionForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (!validateForm()) {
        return;
      }
      
      const id = document.getElementById('subscriptionId').value;
      const subscription = {
        name: document.getElementById('name').value.trim(),
        customType: document.getElementById('customType').value.trim(),
        notes: document.getElementById('notes').value.trim() || '',
        isActive: document.getElementById('isActive').checked,
        autoRenew: document.getElementById('autoRenew').checked,
        startDate: document.getElementById('startDate').value,
        expiryDate: document.getElementById('expiryDate').value,
        periodValue: parseInt(document.getElementById('periodValue').value),
        periodUnit: document.getElementById('periodUnit').value,
        reminderDays: parseInt(document.getElementById('reminderDays').value) || 0,
        price: parseFloat(document.getElementById('price').value) || 0,
        currency: document.getElementById('currency').value || 'TWD'
      };
      
      const submitButton = e.target.querySelector('button[type="submit"]');
      const originalContent = submitButton.innerHTML;
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>' + (id ? '更新中...' : '保存中...');
      submitButton.disabled = true;
      
      try {
        const url = id ? '/api/subscriptions/' + id : '/api/subscriptions';
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription)
        });
        
        const result = await response.json();
        
        if (result.success) {
          showToast((id ? '更新' : '添加') + '訂閱成功', 'success');
          document.getElementById('subscriptionModal').classList.add('hidden');
          loadSubscriptions();
        } else {
          showToast((id ? '更新' : '添加') + '訂閱失敗: ' + (result.message || '未知錯誤'), 'error');
        }
      } catch (error) {
        console.error((id ? '更新' : '添加') + '訂閱失敗:', error);
        showToast((id ? '更新' : '添加') + '訂閱失敗，請稍後再試', 'error');
      } finally {
        submitButton.innerHTML = originalContent;
        submitButton.disabled = false;
      }
    });
    
    async function editSubscription(e) {
      const id = e.target.dataset.id || e.target.parentElement.dataset.id;
      
      try {
        const response = await fetch('/api/subscriptions/' + id);
        const subscription = await response.json();
        
        if (subscription) {
          document.getElementById('modalTitle').textContent = '編輯訂閱';
          document.getElementById('subscriptionId').value = subscription.id;
          document.getElementById('name').value = subscription.name;
          document.getElementById('customType').value = subscription.customType || '';
          document.getElementById('notes').value = subscription.notes || '';
          document.getElementById('isActive').checked = subscription.isActive !== false;
          document.getElementById('autoRenew').checked = subscription.autoRenew !== false;
          document.getElementById('startDate').value = (subscription.currentPlan?.startDate || subscription.startDate) ? (subscription.currentPlan?.startDate || subscription.startDate).split('T')[0] : '';
          document.getElementById('expiryDate').value = (subscription.currentPlan?.expiryDate || subscription.expiryDate) ? (subscription.currentPlan?.expiryDate || subscription.expiryDate).split('T')[0] : '';
          document.getElementById('periodValue').value = subscription.currentPlan?.periodValue || subscription.periodValue || 1;
          document.getElementById('periodUnit').value = subscription.currentPlan?.periodUnit || subscription.periodUnit || 'month';
          document.getElementById('reminderDays').value = subscription.reminderDays !== undefined ? subscription.reminderDays : 7;
          document.getElementById('price').value = subscription.currentPlan?.price || subscription.price || 0;
          document.getElementById('currency').value = subscription.currentPlan?.currency || subscription.currency || 'TWD';
          
          clearFieldErrors();
          document.getElementById('subscriptionModal').classList.remove('hidden');
          setupModalEventListeners();
          
          // 獲取匯率並更新顯示
          await fetchExchangeRates();
          updateExchangeRateDisplay();
        }
      } catch (error) {
        console.error('獲取訂閱信息失敗:', error);
        showToast('獲取訂閱信息失敗', 'error');
      }
    }
    
    async function deleteSubscription(e) {
      const id = e.target.dataset.id || e.target.parentElement.dataset.id;
      
      if (!confirm('确定要删除這個訂閱吗？此操作不可恢复。')) {
        return;
      }
      
      const button = e.target.tagName === 'BUTTON' ? e.target : e.target.parentElement;
      const originalContent = button.innerHTML;
      button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>删除中...';
      button.disabled = true;
      
      try {
        const response = await fetch('/api/subscriptions/' + id, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          showToast('删除成功', 'success');
          loadSubscriptions();
        } else {
          const error = await response.json();
          showToast('删除失敗: ' + (error.message || '未知錯誤'), 'error');
          button.innerHTML = originalContent;
          button.disabled = false;
        }
      } catch (error) {
        console.error('删除訂閱失敗:', error);
        showToast('删除失敗，請稍後再試', 'error');
        button.innerHTML = originalContent;
        button.disabled = false;
      }
    }
    
    window.addEventListener('load', loadSubscriptions);
  </script>
</body>
</html>
`;

const configPage = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>系统配置 - 訂閱管理系統</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
  <style>
    .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); transition: all 0.3s; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); }
    .btn-secondary { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); transition: all 0.3s; }
    .btn-secondary:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); }
    
    .toast {
      position: fixed; top: 20px; right: 20px; padding: 12px 20px; border-radius: 8px;
      color: white; font-weight: 500; z-index: 1000; transform: translateX(400px);
      transition: all 0.3s ease-in-out; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .toast.show { transform: translateX(0); }
    .toast.success { background-color: #10b981; }
    .toast.error { background-color: #ef4444; }
    .toast.info { background-color: #3b82f6; }
    .toast.warning { background-color: #f59e0b; }
    
    .config-section { 
      border: 1px solid #e5e7eb; 
      border-radius: 8px; 
      padding: 16px; 
      margin-bottom: 24px; 
    }
    .config-section.active { 
      background-color: #f8fafc; 
      border-color: #6366f1; 
    }
    .config-section.inactive { 
      background-color: #f9fafb; 
      opacity: 0.7; 
    }
  </style>
</head>
<body class="bg-gray-100 min-h-screen">
  <div id="toast-container"></div>

  <nav class="bg-white shadow-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <i class="fas fa-calendar-check text-indigo-600 text-2xl mr-2"></i>
          <span class="font-bold text-xl text-gray-800">訂閱管理系統</span>
        </div>
        <div class="flex items-center space-x-4">
          <a href="/admin" class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-list mr-1"></i>訂閱列表
          </a>
          <a href="/admin/config" class="text-indigo-600 border-b-2 border-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-cog mr-1"></i>系统配置
          </a>
          <a href="/api/logout" class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-sign-out-alt mr-1"></i>退出登錄
          </a>
        </div>
      </div>
    </div>
  </nav>
  
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">系统配置</h2>
      
      <form id="configForm" class="space-y-8">
        <div class="border-b border-gray-200 pb-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">管理员账户</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="adminUsername" class="block text-sm font-medium text-gray-700">用户名</label>
              <input type="text" id="adminUsername" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
            </div>
            <div>
              <label for="adminPassword" class="block text-sm font-medium text-gray-700">密碼</label>
              <input type="password" id="adminPassword" placeholder="如不修改密碼，請留空" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              <p class="mt-1 text-sm text-gray-500">留空表示不修改当前密碼</p>
            </div>
          </div>
        </div>
        
        <div class="border-b border-gray-200 pb-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">通知設置</h3>
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-3">通知方式</label>
            <div class="flex space-x-6">
              <label class="inline-flex items-center">
                <input type="radio" name="notificationType" value="telegram" class="form-radio h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                <span class="ml-2 text-sm text-gray-700">Telegram</span>
              </label>
              <label class="inline-flex items-center">
                <input type="radio" name="notificationType" value="notifyx" class="form-radio h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" checked>
                <span class="ml-2 text-sm text-gray-700 font-semibold">NotifyX（推荐）</span>
              </label>
              <a href="https://www.notifyx.cn/" target="_blank" class="text-indigo-600 hover:text-indigo-800 text-sm">
                <i class="fas fa-external-link-alt ml-1"></i> NotifyX官网
              </a>
            </div>
          </div>
          
          <div id="telegramConfig" class="config-section">
            <h4 class="text-md font-medium text-gray-900 mb-3">Telegram 配置</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label for="tgBotToken" class="block text-sm font-medium text-gray-700">Bot Token</label>
                <input type="text" id="tgBotToken" placeholder="从 @BotFather 獲取" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              </div>
              <div>
                <label for="tgChatId" class="block text-sm font-medium text-gray-700">Chat ID</label>
                <input type="text" id="tgChatId" placeholder="可从 @userinfobot 獲取" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              </div>
            </div>
            <div class="flex justify-end">
              <button type="button" id="testTelegramBtn" class="btn-secondary text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-paper-plane mr-2"></i>測試 Telegram 通知
              </button>
            </div>
          </div>
          
          <div id="notifyxConfig" class="config-section">
            <h4 class="text-md font-medium text-gray-900 mb-3">NotifyX 配置</h4>
            <div class="mb-4">
              <label for="notifyxApiKey" class="block text-sm font-medium text-gray-700">API Key</label>
              <input type="text" id="notifyxApiKey" placeholder="从 NotifyX 平台獲取的 API Key" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              <p class="mt-1 text-sm text-gray-500">从 <a href="https://www.notifyx.cn/" target="_blank" class="text-indigo-600 hover:text-indigo-800">NotifyX平台</a> 獲取的 API Key</p>
            </div>
            <div class="flex justify-end">
              <button type="button" id="testNotifyXBtn" class="btn-secondary text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-paper-plane mr-2"></i>測試 NotifyX 通知
              </button>
            </div>
          </div>
        </div>
        
        <div class="flex justify-end">
          <button type="submit" class="btn-primary text-white px-6 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-save mr-2"></i>保存配置
          </button>
        </div>
      </form>
    </div>
  </div>

  <script>
    function showToast(message, type = 'success', duration = 3000) {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = 'toast ' + type;
      
      const icon = type === 'success' ? 'check-circle' :
                   type === 'error' ? 'exclamation-circle' :
                   type === 'warning' ? 'exclamation-triangle' : 'info-circle';
      
      toast.innerHTML = '<div class="flex items-center"><i class="fas fa-' + icon + ' mr-2"></i><span>' + message + '</span></div>';
      
      container.appendChild(toast);
      setTimeout(() => toast.classList.add('show'), 100);
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          if (container.contains(toast)) {
            container.removeChild(toast);
          }
        }, 300);
      }, duration);
    }

    async function loadConfig() {
      try {
        const response = await fetch('/api/config');
        const config = await response.json();
        
        document.getElementById('adminUsername').value = config.ADMIN_USERNAME || '';
        document.getElementById('tgBotToken').value = config.TG_BOT_TOKEN || '';
        document.getElementById('tgChatId').value = config.TG_CHAT_ID || '';
        document.getElementById('notifyxApiKey').value = config.NOTIFYX_API_KEY || '';
        
        const notificationType = config.NOTIFICATION_TYPE || 'notifyx';
        document.querySelector('input[name="notificationType"][value="' + notificationType + '"]').checked = true;
        
        toggleNotificationConfig(notificationType);
      } catch (error) {
        console.error('加載配置失敗:', error);
        showToast('加載配置失敗，請刷新頁面重試', 'error');
      }
    }
    
    function toggleNotificationConfig(type) {
      const telegramConfig = document.getElementById('telegramConfig');
      const notifyxConfig = document.getElementById('notifyxConfig');
      
      if (type === 'telegram') {
        telegramConfig.classList.remove('inactive');
        telegramConfig.classList.add('active');
        notifyxConfig.classList.remove('active');
        notifyxConfig.classList.add('inactive');
      } else if (type === 'notifyx') {
        telegramConfig.classList.remove('active');
        telegramConfig.classList.add('inactive');
        notifyxConfig.classList.remove('inactive');
        notifyxConfig.classList.add('active');
      }
    }
    
    document.querySelectorAll('input[name="notificationType"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        toggleNotificationConfig(e.target.value);
      });
    });
    
    document.getElementById('configForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const config = {
        ADMIN_USERNAME: document.getElementById('adminUsername').value.trim(),
        TG_BOT_TOKEN: document.getElementById('tgBotToken').value.trim(),
        TG_CHAT_ID: document.getElementById('tgChatId').value.trim(),
        NOTIFYX_API_KEY: document.getElementById('notifyxApiKey').value.trim(),
        NOTIFICATION_TYPE: document.querySelector('input[name="notificationType"]:checked').value
      };
      
      const passwordField = document.getElementById('adminPassword');
      if (passwordField.value.trim()) {
        config.ADMIN_PASSWORD = passwordField.value.trim();
      }
      
      const submitButton = e.target.querySelector('button[type="submit"]');
      const originalContent = submitButton.innerHTML;
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>保存中...';
      submitButton.disabled = true;
      
      try {
        const response = await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        });
        
        const result = await response.json();
        
        if (result.success) {
          showToast('配置保存成功', 'success');
          passwordField.value = '';
        } else {
          showToast('配置保存失敗: ' + (result.message || '未知錯誤'), 'error');
        }
      } catch (error) {
        console.error('保存配置失敗:', error);
        showToast('保存配置失敗，請稍後再試', 'error');
      } finally {
        submitButton.innerHTML = originalContent;
        submitButton.disabled = false;
      }
    });
    
    async function testNotification(type) {
      const button = document.getElementById(type === 'telegram' ? 'testTelegramBtn' : 'testNotifyXBtn');
      const originalContent = button.innerHTML;
      const serviceName = type === 'telegram' ? 'Telegram' : 'NotifyX';
      
      button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>測試中...';
      button.disabled = true;
      
      const config = {};
      if (type === 'telegram') {
        config.TG_BOT_TOKEN = document.getElementById('tgBotToken').value.trim();
        config.TG_CHAT_ID = document.getElementById('tgChatId').value.trim();
        
        if (!config.TG_BOT_TOKEN || !config.TG_CHAT_ID) {
          showToast('請先填寫 Telegram Bot Token 和 Chat ID', 'warning');
          button.innerHTML = originalContent;
          button.disabled = false;
          return;
        }
      } else {
        config.NOTIFYX_API_KEY = document.getElementById('notifyxApiKey').value.trim();
        
        if (!config.NOTIFYX_API_KEY) {
          showToast('請先填寫 NotifyX API Key', 'warning');
          button.innerHTML = originalContent;
          button.disabled = false;
          return;
        }
      }
      
      try {
        const response = await fetch('/api/test-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: type, ...config })
        });
        
        const result = await response.json();
        
        if (result.success) {
          showToast(serviceName + ' 通知測試成功！', 'success');
        } else {
          showToast(serviceName + ' 通知測試失敗: ' + (result.message || '未知錯誤'), 'error');
        }
      } catch (error) {
        console.error('測試通知失敗:', error);
        showToast('測試失敗，請稍後再試', 'error');
      } finally {
        button.innerHTML = originalContent;
        button.disabled = false;
      }
    }
    
    document.getElementById('testTelegramBtn').addEventListener('click', () => {
      testNotification('telegram');
    });
    
    document.getElementById('testNotifyXBtn').addEventListener('click', () => {
      testNotification('notifyx');
    });
    
    window.addEventListener('load', loadConfig);
  </script>
</body>
</html>
`;

// 管理頁面
const admin = {
  async handleRequest(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    const token = getCookieValue(request.headers.get('Cookie'), 'token');
    const config = await getConfig(env);
    const user = token ? await verifyJWT(token, config.JWT_SECRET) : null;
    
    if (!user) {
      return new Response('', {
        status: 302,
        headers: { 'Location': '/' }
      });
    }
    
    if (pathname === '/admin/config') {
      return new Response(configPage, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
    
    return new Response(adminPage, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
};

// 處理API請求
const api = {
  async handleRequest(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.slice(4);
    const method = request.method;
    
    const config = await getConfig(env);
    
    if (path === '/login' && method === 'POST') {
      const body = await request.json();
      
      if (body.username === config.ADMIN_USERNAME && body.password === config.ADMIN_PASSWORD) {
        const token = await generateJWT(body.username, config.JWT_SECRET);
        
        return new Response(
          JSON.stringify({ success: true }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Set-Cookie': 'token=' + token + '; HttpOnly; Path=/; SameSite=Strict; Max-Age=86400'
            }
          }
        );
      } else {
        return new Response(
          JSON.stringify({ success: false, message: '用户名或密碼錯誤' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    if (path === '/logout' && (method === 'GET' || method === 'POST')) {
      return new Response('', {
        status: 302,
        headers: {
          'Location': '/',
          'Set-Cookie': 'token=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0'
        }
      });
    }
    
    const token = getCookieValue(request.headers.get('Cookie'), 'token');
    const user = token ? await verifyJWT(token, config.JWT_SECRET) : null;
    
    if (!user && path !== '/login') {
      return new Response(
        JSON.stringify({ success: false, message: '未授權訪問' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (path === '/config') {
      if (method === 'GET') {
        const { JWT_SECRET, ADMIN_PASSWORD, ...safeConfig } = config;
        return new Response(
          JSON.stringify(safeConfig),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      if (method === 'POST') {
        try {
          const newConfig = await request.json();
          
          const updatedConfig = { 
            ...config,
            ADMIN_USERNAME: newConfig.ADMIN_USERNAME || config.ADMIN_USERNAME,
            TG_BOT_TOKEN: newConfig.TG_BOT_TOKEN || '',
            TG_CHAT_ID: newConfig.TG_CHAT_ID || '',
            NOTIFYX_API_KEY: newConfig.NOTIFYX_API_KEY || '',
            NOTIFICATION_TYPE: newConfig.NOTIFICATION_TYPE || config.NOTIFICATION_TYPE
          };
          
          if (newConfig.ADMIN_PASSWORD) {
            updatedConfig.ADMIN_PASSWORD = newConfig.ADMIN_PASSWORD;
          }
          
          await env.SUBSCRIPTIONS_KV.put('config', JSON.stringify(updatedConfig));
          
          return new Response(
            JSON.stringify({ success: true }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ success: false, message: '更新配置失敗' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }
    
    if (path === '/test-notification' && method === 'POST') {
      try {
        const body = await request.json();
        let success = false;
        let message = '';
        
        if (body.type === 'telegram') {
          const testConfig = {
            ...config,
            TG_BOT_TOKEN: body.TG_BOT_TOKEN,
            TG_CHAT_ID: body.TG_CHAT_ID
          };
          
          const content = '*測試通知*\n\n這是一條測試通知，用於驗證Telegram通知功能是否正常工作。\n\n發送時間: ' + new Date().toLocaleString();
          success = await sendTelegramNotification(content, testConfig);
          message = success ? 'Telegram通知發送成功' : 'Telegram通知發送失敗，請檢查配置';
        } else if (body.type === 'notifyx') {
          const testConfig = {
            ...config,
            NOTIFYX_API_KEY: body.NOTIFYX_API_KEY
          };
          
          const title = '測試通知';
          const content = '## 這是一條測試通知\n\n用於驗證NotifyX通知功能是否正常工作。\n\n發送時間: ' + new Date().toLocaleString();
          const description = '測試NotifyX通知功能';
          
          success = await sendNotifyXNotification(title, content, description, testConfig);
          message = success ? 'NotifyX通知發送成功' : 'NotifyX通知發送失敗，請檢查配置';
        }
        
        return new Response(
          JSON.stringify({ success, message }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('測試通知失敗:', error);
        return new Response(
          JSON.stringify({ success: false, message: '測試通知失敗: ' + error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Currency exchange rate endpoints
    if (path === '/currency/rates' && method === 'GET') {
      try {
        // 首先嘗試從 KV 獲取緩存的匯率
        const cachedRates = await env.SUBSCRIPTIONS_KV.get('currency_rates');
        
        if (cachedRates) {
          const ratesData = JSON.parse(cachedRates);
          const now = new Date();
          const lastUpdated = new Date(ratesData.lastUpdated);
          const hoursDiff = (now - lastUpdated) / (1000 * 60 * 60);
          
          // 如果緩存的匯率在24小時內，直接返回
          if (hoursDiff < 24) {
            return new Response(
              JSON.stringify({ success: true, data: ratesData }),
              { headers: { 'Content-Type': 'application/json' } }
            );
          }
        }
        
        // 如果沒有緩存或已過期，從 API 獲取最新匯率
        const apiKey = '1723cb21602885ad29fd3f13';
        const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`);
        const apiData = await response.json();
        
        if (apiData.result === 'success') {
          const ratesData = {
            base: 'USD',
            rates: apiData.conversion_rates,
            lastUpdated: new Date().toISOString(),
            source: 'exchangerate-api.com'
          };
          
          // 緩存到 KV
          await env.SUBSCRIPTIONS_KV.put('currency_rates', JSON.stringify(ratesData));
          
          return new Response(
            JSON.stringify({ success: true, data: ratesData }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        } else {
          throw new Error(apiData['error-type'] || '匯率 API 錯誤');
        }
      } catch (error) {
        return new Response(
          JSON.stringify({ success: false, message: '獲取匯率失敗: ' + error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    if (path === '/currency/update' && method === 'POST') {
      try {
        // 強制更新匯率
        const apiKey = '1723cb21602885ad29fd3f13';
        const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`);
        const apiData = await response.json();
        
        if (apiData.result === 'success') {
          const ratesData = {
            base: 'USD',
            rates: apiData.conversion_rates,
            lastUpdated: new Date().toISOString(),
            source: 'exchangerate-api.com'
          };
          
          await env.SUBSCRIPTIONS_KV.put('currency_rates', JSON.stringify(ratesData));
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: '匯率更新成功',
              data: ratesData
            }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        } else {
          throw new Error(apiData['error-type'] || '匯率 API 錯誤');
        }
      } catch (error) {
        return new Response(
          JSON.stringify({ success: false, message: '更新匯率失敗: ' + error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    if (path === '/currency/convert' && method === 'POST') {
      try {
        const body = await request.json();
        const { amount, from, to } = body;
        
        if (!amount || !from || !to) {
          return new Response(
            JSON.stringify({ success: false, message: '缺少必要參數: amount, from, to' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        // 獲取最新匯率
        const ratesData = await env.SUBSCRIPTIONS_KV.get('currency_rates');
        let rates;
        
        if (ratesData) {
          const parsed = JSON.parse(ratesData);
          rates = parsed.rates;
        } else {
          // 如果沒有緩存匯率，從 API 獲取
          const apiKey = '1723cb21602885ad29fd3f13';
          const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`);
          const apiData = await response.json();
          
          if (apiData.result === 'success') {
            rates = apiData.conversion_rates;
          } else {
            throw new Error('無法獲取匯率數據');
          }
        }
        
        // 進行貨幣轉換 (所有匯率都基於 USD)
        let convertedAmount;
        if (from === 'USD') {
          convertedAmount = amount * rates[to];
        } else if (to === 'USD') {
          convertedAmount = amount / rates[from];
        } else {
          // 先轉換到 USD，再轉換到目標貨幣
          const usdAmount = amount / rates[from];
          convertedAmount = usdAmount * rates[to];
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            convertedAmount: parseFloat(convertedAmount.toFixed(4)),
            originalAmount: amount,
            from,
            to,
            rate: convertedAmount / amount
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ success: false, message: '貨幣轉換失敗: ' + error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    if (path === '/subscriptions') {
      if (method === 'GET') {
        const subscriptions = await getAllSubscriptions(env);
        return new Response(
          JSON.stringify(subscriptions),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      if (method === 'POST') {
        const subscription = await request.json();
        const result = await createSubscription(subscription, env);
        
        return new Response(
          JSON.stringify(result),
          { 
            status: result.success ? 201 : 400, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }
    }
    
    if (path.startsWith('/subscriptions/')) {
      const parts = path.split('/');
      const id = parts[2];
      
      if (parts[3] === 'toggle-status' && method === 'POST') {
        const body = await request.json();
        const result = await toggleSubscriptionStatus(id, body.isActive, env);
        
        return new Response(
          JSON.stringify(result),
          { 
            status: result.success ? 200 : 400, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }

      if (parts[3] === 'test-notify' && method === 'POST') {
        const result = await testSingleSubscriptionNotification(id, env);
        return new Response(JSON.stringify(result), { status: result.success ? 200 : 500, headers: { 'Content-Type': 'application/json' } });
      }
      
      if (method === 'GET') {
        const subscription = await getSubscription(id, env);
        
        return new Response(
          JSON.stringify(subscription),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      if (method === 'PUT') {
        const subscription = await request.json();
        const result = await updateSubscription(id, subscription, env);
        
        return new Response(
          JSON.stringify(result),
          { 
            status: result.success ? 200 : 400, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }
      
      if (method === 'DELETE') {
        const result = await deleteSubscription(id, env);
        
        return new Response(
          JSON.stringify(result),
          { 
            status: result.success ? 200 : 400, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }
    }
    
    // Purchase History endpoints
    if (path.startsWith('/subscriptions/') && path.includes('/purchases')) {
      const parts = path.split('/');
      const subscriptionId = parts[2];
      
      if (parts[3] === 'purchases' && method === 'GET') {
        // GET /api/subscriptions/:id/purchases
        try {
          const purchases = await getSubscriptionPurchases(subscriptionId, env);
          return new Response(
            JSON.stringify({ success: true, data: purchases }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ success: false, message: '獲取購買記錄失敗: ' + error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
      
      if (parts[3] === 'purchases' && method === 'POST') {
        // POST /api/subscriptions/:id/purchases
        try {
          const purchase = await request.json();
          const result = await createPurchase(subscriptionId, purchase, env);
          return new Response(
            JSON.stringify(result),
            { 
              status: result.success ? 201 : 400, 
              headers: { 'Content-Type': 'application/json' } 
            }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ success: false, message: '創建購買記錄失敗: ' + error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }
    
    if (path.startsWith('/purchases/')) {
      const parts = path.split('/');
      const purchaseId = parts[2];
      
      if (method === 'PUT') {
        // PUT /api/purchases/:purchaseId
        try {
          const purchase = await request.json();
          const result = await updatePurchase(purchaseId, purchase, env);
          return new Response(
            JSON.stringify(result),
            { 
              status: result.success ? 200 : 400, 
              headers: { 'Content-Type': 'application/json' } 
            }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ success: false, message: '更新購買記錄失敗: ' + error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
      
      if (method === 'DELETE') {
        // DELETE /api/purchases/:purchaseId
        try {
          const result = await deletePurchase(purchaseId, env);
          return new Response(
            JSON.stringify(result),
            { 
              status: result.success ? 200 : 400, 
              headers: { 'Content-Type': 'application/json' } 
            }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ success: false, message: '刪除購買記錄失敗: ' + error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }
    
    return new Response(
      JSON.stringify({ success: false, message: '未找到請求的資源' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// 工具函數
async function getConfig(env) {
  try {
    const data = await env.SUBSCRIPTIONS_KV.get('config');
    const config = data ? JSON.parse(data) : {};
    
    return {
      ADMIN_USERNAME: config.ADMIN_USERNAME || 'admin',
      ADMIN_PASSWORD: config.ADMIN_PASSWORD || 'password',
      JWT_SECRET: config.JWT_SECRET || 'your-secret-key',
      TG_BOT_TOKEN: config.TG_BOT_TOKEN || '',
      TG_CHAT_ID: config.TG_CHAT_ID || '',
      NOTIFYX_API_KEY: config.NOTIFYX_API_KEY || '',
      NOTIFICATION_TYPE: config.NOTIFICATION_TYPE || 'notifyx'
    };
  } catch (error) {
    return {
      ADMIN_USERNAME: 'admin',
      ADMIN_PASSWORD: 'password',
      JWT_SECRET: 'your-secret-key',
      TG_BOT_TOKEN: '',
      TG_CHAT_ID: '',
      NOTIFYX_API_KEY: '',
      NOTIFICATION_TYPE: 'notifyx'
    };
  }
}

async function generateJWT(username, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = { username, iat: Math.floor(Date.now() / 1000) };
  
  const headerBase64 = btoa(JSON.stringify(header));
  const payloadBase64 = btoa(JSON.stringify(payload));
  
  const signatureInput = headerBase64 + '.' + payloadBase64;
  const signature = await CryptoJS.HmacSHA256(signatureInput, secret);
  
  return headerBase64 + '.' + payloadBase64 + '.' + signature;
}

async function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [headerBase64, payloadBase64, signature] = parts;
    const signatureInput = headerBase64 + '.' + payloadBase64;
    const expectedSignature = await CryptoJS.HmacSHA256(signatureInput, secret);
    
    if (signature !== expectedSignature) return null;
    
    const payload = JSON.parse(atob(payloadBase64));
    return payload;
  } catch (error) {
    return null;
  }
}

async function getAllSubscriptions(env) {
  try {
    const data = await env.SUBSCRIPTIONS_KV.get('subscriptions');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
}

async function getSubscription(id, env) {
  const subscriptions = await getAllSubscriptions(env);
  return subscriptions.find(s => s.id === id);
}

async function createSubscription(subscription, env) {
  try {
    const subscriptions = await getAllSubscriptions(env);
    
    if (!subscription.name || !subscription.expiryDate) {
      return { success: false, message: '缺少必填字段' };
    }
    
    let expiryDate = new Date(subscription.expiryDate);
    const now = new Date();
    
    if (expiryDate < now && subscription.periodValue && subscription.periodUnit) {
      while (expiryDate < now) {
        if (subscription.periodUnit === 'day') {
          expiryDate.setDate(expiryDate.getDate() + subscription.periodValue);
        } else if (subscription.periodUnit === 'month') {
          expiryDate.setMonth(expiryDate.getMonth() + subscription.periodValue);
        } else if (subscription.periodUnit === 'year') {
          expiryDate.setFullYear(expiryDate.getFullYear() + subscription.periodValue);
        }
      }
      subscription.expiryDate = expiryDate.toISOString();
    }
    
    const newSubscription = {
      id: Date.now().toString(),
      name: subscription.name,
      customType: subscription.customType || '',
      currentPlan: {
        startDate: subscription.startDate || null,
        expiryDate: subscription.expiryDate,
        price: subscription.price || 0,
        currency: subscription.currency || 'TWD',
        platform: subscription.platform || '未指定',
        periodValue: subscription.periodValue || 1,
        periodUnit: subscription.periodUnit || 'month'
      },
      purchaseHistory: [],
      statistics: {
        totalSpent: subscription.price || 0,
        totalMonths: subscription.periodValue || 1,
        averageMonthlyFee: (subscription.price || 0) / (subscription.periodValue || 1),
        bestDeal: null,
        platformCount: 1,
        platforms: [subscription.platform || '未指定']
      },
      reminderDays: subscription.reminderDays !== undefined ? subscription.reminderDays : 7,
      notes: subscription.notes || '',
      isActive: subscription.isActive !== false,
      autoRenew: subscription.autoRenew !== false,
      createdAt: new Date().toISOString()
    };
    
    subscriptions.push(newSubscription);
    
    await env.SUBSCRIPTIONS_KV.put('subscriptions', JSON.stringify(subscriptions));
    
    return { success: true, subscription: newSubscription };
  } catch (error) {
    return { success: false, message: '創建訂閱失敗' };
  }
}

async function updateSubscription(id, subscription, env) {
  try {
    const subscriptions = await getAllSubscriptions(env);
    const index = subscriptions.findIndex(s => s.id === id);
    
    if (index === -1) {
      return { success: false, message: '訂閱不存在' };
    }
    
    if (!subscription.name || !subscription.expiryDate) {
      return { success: false, message: '缺少必填字段' };
    }
    
    let expiryDate = new Date(subscription.expiryDate);
    const now = new Date();
    
    if (expiryDate < now && subscription.periodValue && subscription.periodUnit) {
      while (expiryDate < now) {
        if (subscription.periodUnit === 'day') {
          expiryDate.setDate(expiryDate.getDate() + subscription.periodValue);
        } else if (subscription.periodUnit === 'month') {
          expiryDate.setMonth(expiryDate.getMonth() + subscription.periodValue);
        } else if (subscription.periodUnit === 'year') {
          expiryDate.setFullYear(expiryDate.getFullYear() + subscription.periodValue);
        }
      }
      subscription.expiryDate = expiryDate.toISOString();
    }
    
    // 初始化 currentPlan 如果不存在
    if (!subscriptions[index].currentPlan) {
      subscriptions[index].currentPlan = {
        startDate: subscriptions[index].startDate || null,
        expiryDate: subscriptions[index].expiryDate,
        price: subscriptions[index].price || 0,
        currency: subscriptions[index].currency || 'TWD',
        platform: '未指定',
        periodValue: subscriptions[index].periodValue || 1,
        periodUnit: subscriptions[index].periodUnit || 'month'
      };
    }
    
    subscriptions[index] = {
      ...subscriptions[index],
      name: subscription.name,
      customType: subscription.customType || subscriptions[index].customType || '',
      currentPlan: {
        startDate: subscription.startDate || subscriptions[index].currentPlan.startDate,
        expiryDate: subscription.expiryDate,
        price: subscription.price !== undefined ? subscription.price : subscriptions[index].currentPlan.price,
        currency: subscription.currency || subscriptions[index].currentPlan.currency || 'TWD',
        platform: subscription.platform || subscriptions[index].currentPlan.platform || '未指定',
        periodValue: subscription.periodValue || subscriptions[index].currentPlan.periodValue || 1,
        periodUnit: subscription.periodUnit || subscriptions[index].currentPlan.periodUnit || 'month'
      },
      reminderDays: subscription.reminderDays !== undefined ? subscription.reminderDays : (subscriptions[index].reminderDays !== undefined ? subscriptions[index].reminderDays : 7),
      notes: subscription.notes || '',
      isActive: subscription.isActive !== undefined ? subscription.isActive : subscriptions[index].isActive,
      autoRenew: subscription.autoRenew !== undefined ? subscription.autoRenew : (subscriptions[index].autoRenew !== undefined ? subscriptions[index].autoRenew : true),
      updatedAt: new Date().toISOString()
    };
    
    // 重新計算統計資訊
    subscriptions[index].statistics = calculateSubscriptionStatistics(subscriptions[index]);
    
    await env.SUBSCRIPTIONS_KV.put('subscriptions', JSON.stringify(subscriptions));
    
    return { success: true, subscription: subscriptions[index] };
  } catch (error) {
    return { success: false, message: '更新訂閱失敗' };
  }
}

async function deleteSubscription(id, env) {
  try {
    const subscriptions = await getAllSubscriptions(env);
    const filteredSubscriptions = subscriptions.filter(s => s.id !== id);
    
    if (filteredSubscriptions.length === subscriptions.length) {
      return { success: false, message: '訂閱不存在' };
    }
    
    await env.SUBSCRIPTIONS_KV.put('subscriptions', JSON.stringify(filteredSubscriptions));
    
    return { success: true };
  } catch (error) {
    return { success: false, message: '删除訂閱失敗' };
  }
}

async function toggleSubscriptionStatus(id, isActive, env) {
  try {
    const subscriptions = await getAllSubscriptions(env);
    const index = subscriptions.findIndex(s => s.id === id);
    
    if (index === -1) {
      return { success: false, message: '訂閱不存在' };
    }
    
    subscriptions[index] = {
      ...subscriptions[index],
      isActive: isActive,
      updatedAt: new Date().toISOString()
    };
    
    await env.SUBSCRIPTIONS_KV.put('subscriptions', JSON.stringify(subscriptions));
    
    return { success: true, subscription: subscriptions[index] };
  } catch (error) {
    return { success: false, message: '更新訂閱狀態失敗' };
  }
}

// Purchase History helper functions
async function getSubscriptionPurchases(subscriptionId, env) {
  try {
    const subscription = await getSubscription(subscriptionId, env);
    if (!subscription) {
      return { success: false, message: '未找到該訂閱' };
    }
    
    return {
      success: true,
      data: subscription.purchaseHistory || []
    };
  } catch (error) {
    return { success: false, message: '獲取購買記錄失敗: ' + error.message };
  }
}

async function createPurchase(subscriptionId, purchaseData, env) {
  try {
    const subscriptions = await getAllSubscriptions(env);
    const index = subscriptions.findIndex(sub => sub.id === subscriptionId);
    
    if (index === -1) {
      return { success: false, message: '未找到該訂閱' };
    }
    
    // 驗證必要字段
    if (!purchaseData.price || !purchaseData.currency || !purchaseData.platform) {
      return { success: false, message: '缺少必要字段: price, currency, platform' };
    }
    
    // 創建新購買記錄
    const newPurchase = {
      id: `purchase_${subscriptionId}_${Date.now()}`,
      purchaseDate: purchaseData.purchaseDate || new Date().toISOString(),
      startDate: purchaseData.startDate || purchaseData.purchaseDate || new Date().toISOString(),
      endDate: purchaseData.endDate || null,
      price: parseFloat(purchaseData.price),
      currency: purchaseData.currency,
      originalPrice: purchaseData.originalPrice || null,
      originalCurrency: purchaseData.originalCurrency || null,
      platform: purchaseData.platform,
      duration: purchaseData.duration || 1,
      durationUnit: purchaseData.durationUnit || 'month',
      notes: purchaseData.notes || ''
    };
    
    // 初始化 purchaseHistory 如果不存在
    if (!subscriptions[index].purchaseHistory) {
      subscriptions[index].purchaseHistory = [];
    }
    
    // 添加新購買記錄
    subscriptions[index].purchaseHistory.push(newPurchase);
    
    // 重新計算統計資訊
    subscriptions[index].statistics = calculateSubscriptionStatistics(subscriptions[index]);
    subscriptions[index].updatedAt = new Date().toISOString();
    
    // 保存到 KV
    await env.SUBSCRIPTIONS_KV.put('subscriptions', JSON.stringify(subscriptions));
    
    return { 
      success: true, 
      message: '購買記錄創建成功',
      purchase: newPurchase
    };
  } catch (error) {
    return { success: false, message: '創建購買記錄失敗: ' + error.message };
  }
}

async function updatePurchase(purchaseId, purchaseData, env) {
  try {
    const subscriptions = await getAllSubscriptions(env);
    let foundPurchase = null;
    let subscriptionIndex = -1;
    let purchaseIndex = -1;
    
    // 尋找購買記錄
    for (let i = 0; i < subscriptions.length; i++) {
      if (subscriptions[i].purchaseHistory) {
        const pIndex = subscriptions[i].purchaseHistory.findIndex(p => p.id === purchaseId);
        if (pIndex !== -1) {
          foundPurchase = subscriptions[i].purchaseHistory[pIndex];
          subscriptionIndex = i;
          purchaseIndex = pIndex;
          break;
        }
      }
    }
    
    if (!foundPurchase) {
      return { success: false, message: '未找到該購買記錄' };
    }
    
    // 更新購買記錄
    const updatedPurchase = {
      ...foundPurchase,
      ...purchaseData,
      id: purchaseId, // 保持原 ID
      price: purchaseData.price ? parseFloat(purchaseData.price) : foundPurchase.price
    };
    
    subscriptions[subscriptionIndex].purchaseHistory[purchaseIndex] = updatedPurchase;
    
    // 重新計算統計資訊
    subscriptions[subscriptionIndex].statistics = calculateSubscriptionStatistics(subscriptions[subscriptionIndex]);
    subscriptions[subscriptionIndex].updatedAt = new Date().toISOString();
    
    // 保存到 KV
    await env.SUBSCRIPTIONS_KV.put('subscriptions', JSON.stringify(subscriptions));
    
    return { 
      success: true, 
      message: '購買記錄更新成功',
      purchase: updatedPurchase
    };
  } catch (error) {
    return { success: false, message: '更新購買記錄失敗: ' + error.message };
  }
}

async function deletePurchase(purchaseId, env) {
  try {
    const subscriptions = await getAllSubscriptions(env);
    let foundPurchase = null;
    let subscriptionIndex = -1;
    let purchaseIndex = -1;
    
    // 尋找購買記錄
    for (let i = 0; i < subscriptions.length; i++) {
      if (subscriptions[i].purchaseHistory) {
        const pIndex = subscriptions[i].purchaseHistory.findIndex(p => p.id === purchaseId);
        if (pIndex !== -1) {
          foundPurchase = subscriptions[i].purchaseHistory[pIndex];
          subscriptionIndex = i;
          purchaseIndex = pIndex;
          break;
        }
      }
    }
    
    if (!foundPurchase) {
      return { success: false, message: '未找到該購買記錄' };
    }
    
    // 刪除購買記錄
    subscriptions[subscriptionIndex].purchaseHistory.splice(purchaseIndex, 1);
    
    // 重新計算統計資訊
    subscriptions[subscriptionIndex].statistics = calculateSubscriptionStatistics(subscriptions[subscriptionIndex]);
    subscriptions[subscriptionIndex].updatedAt = new Date().toISOString();
    
    // 保存到 KV
    await env.SUBSCRIPTIONS_KV.put('subscriptions', JSON.stringify(subscriptions));
    
    return { 
      success: true, 
      message: '購買記錄刪除成功'
    };
  } catch (error) {
    return { success: false, message: '刪除購買記錄失敗: ' + error.message };
  }
}

// 計算訂閱統計資訊的輔助函數
function calculateSubscriptionStatistics(subscription) {
  if (!subscription.purchaseHistory || subscription.purchaseHistory.length === 0) {
    return {
      totalSpent: subscription.currentPlan?.price || 0,
      totalMonths: 1,
      averageMonthlyFee: subscription.currentPlan?.price || 0,
      bestDeal: null,
      platformCount: subscription.currentPlan?.platform ? 1 : 0,
      platforms: subscription.currentPlan?.platform ? [subscription.currentPlan.platform] : []
    };
  }
  
  let totalSpent = 0;
  let totalMonths = 0;
  let bestDeal = null;
  let bestDealRate = Infinity;
  const platforms = new Set();
  
  // 包含當前計劃
  if (subscription.currentPlan) {
    totalSpent += subscription.currentPlan.price || 0;
    totalMonths += subscription.currentPlan.periodValue || 1;
    if (subscription.currentPlan.platform) {
      platforms.add(subscription.currentPlan.platform);
    }
  }
  
  // 計算購買歷史
  subscription.purchaseHistory.forEach(purchase => {
    totalSpent += purchase.price || 0;
    const months = purchase.duration || 1;
    totalMonths += months;
    
    if (purchase.platform) {
      platforms.add(purchase.platform);
    }
    
    // 計算最划算的購買 (每月成本最低)
    const monthlyRate = (purchase.price || 0) / months;
    if (monthlyRate < bestDealRate) {
      bestDealRate = monthlyRate;
      bestDeal = purchase.id;
    }
  });
  
  return {
    totalSpent: parseFloat(totalSpent.toFixed(2)),
    totalMonths: totalMonths,
    averageMonthlyFee: parseFloat((totalSpent / totalMonths).toFixed(2)),
    bestDeal: bestDeal,
    platformCount: platforms.size,
    platforms: Array.from(platforms)
  };
}

async function testSingleSubscriptionNotification(id, env) {
  try {
    const subscription = await getSubscription(id, env);
    if (!subscription) {
      return { success: false, message: '未找到該訂閱' };
    }
    const config = await getConfig(env);

    const title = `手動測試通知: ${subscription.name}`;
    const description = `這是一個對訂閱 "${subscription.name}" 的手動測試通知。`;
    let content = '';

    // 根據所選通知渠道格式化消息内容，与主提醒功能保持一致
    if (config.NOTIFICATION_TYPE === 'notifyx') {
        content = `## ${title}\n\n**訂閱詳情**:\n- **類型**: ${subscription.customType || '其他'}\n- **到期日**: ${new Date(subscription.currentPlan?.expiryDate || subscription.expiryDate).toLocaleDateString()}\n- **價格**: ${(subscription.currentPlan?.price || subscription.price) ? (subscription.currentPlan?.price || subscription.price).toFixed(2) + ' ' + (subscription.currentPlan?.currency || subscription.currency || 'TWD') : '未設定'}\n- **備注**: ${subscription.notes || '无'}`;
    } else { // 默认 Telegram
        content = `*${title}*\n\n**訂閱詳情**:\n- **類型**: ${subscription.customType || '其他'}\n- **到期日**: ${new Date(subscription.currentPlan?.expiryDate || subscription.expiryDate).toLocaleDateString()}\n- **價格**: ${(subscription.currentPlan?.price || subscription.price) ? (subscription.currentPlan?.price || subscription.price).toFixed(2) + ' ' + (subscription.currentPlan?.currency || subscription.currency || 'TWD') : '未設定'}\n- **備注**: ${subscription.notes || '无'}`;
    }

    const success = await sendNotification(title, content, description, config);

    if (success) {
        return { success: true, message: '測試通知已成功發送' };
    } else {
        return { success: false, message: '測試通知發送失敗，請檢查配置' };
    }

  } catch (error) {
    console.error('[手動測試] 發送失敗:', error);
    return { success: false, message: '發送時發生錯誤: ' + error.message };
  }
}

async function sendWeComNotification(message, config) {
    // This is a placeholder. In a real scenario, you would implement the WeCom notification logic here.
    console.log("[企業微信] 通知功能未实现");
    return { success: false, message: "企業微信通知功能未实现" };
}

async function sendNotificationToAllChannels(title, commonContent, config, logPrefix = '[定時任務]') {
    if (!config.ENABLED_NOTIFIERS || config.ENABLED_NOTIFIERS.length === 0) {
        console.log(`${logPrefix} 未啟用任何通知渠道。`);
        return;
    }

    if (config.ENABLED_NOTIFIERS.includes('notifyx')) {
        const notifyxContent = `## ${title}\n\n${commonContent}`;
        const success = await sendNotifyXNotification(title, notifyxContent, `訂閱提醒`, config);
        console.log(`${logPrefix} 發送NotifyX通知 ${success ? '成功' : '失敗'}`);
    }
    if (config.ENABLED_NOTIFIERS.includes('telegram')) {
        const telegramContent = `*${title}*\n\n${commonContent.replace(/(\s)/g, ' ')}`;
        const success = await sendTelegramNotification(telegramContent, config);
        console.log(`${logPrefix} 發送Telegram通知 ${success ? '成功' : '失敗'}`);
    }
    if (config.ENABLED_NOTIFIERS.includes('weixin')) {
        const weixinContent = `【${title}】\n\n${commonContent.replace(/(\**|\*|##|#|`)/g, '')}`;
        const result = await sendWeComNotification(weixinContent, config);
        console.log(`${logPrefix} 發送企業微信通知 ${result.success ? '成功' : '失敗'}. ${result.message}`);
    }
}

async function sendTelegramNotification(message, config) {
  try {
    if (!config.TG_BOT_TOKEN || !config.TG_CHAT_ID) {
      console.error('[Telegram] 通知未配置，缺少Bot Token或Chat ID');
      return false;
    }
    
    console.log('[Telegram] 開始發送通知到 Chat ID: ' + config.TG_CHAT_ID);
    
    const url = 'https://api.telegram.org/bot' + config.TG_BOT_TOKEN + '/sendMessage';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.TG_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });
    
    const result = await response.json();
    console.log('[Telegram] 發送结果:', result);
    return result.ok;
  } catch (error) {
    console.error('[Telegram] 發送通知失敗:', error);
    return false;
  }
}

async function sendNotifyXNotification(title, content, description, config) {
  try {
    if (!config.NOTIFYX_API_KEY) {
      console.error('[NotifyX] 通知未配置，缺少API Key');
      return false;
    }
    
    console.log('[NotifyX] 開始發送通知: ' + title);
    
    const url = 'https://www.notifyx.cn/api/v1/send/' + config.NOTIFYX_API_KEY;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title,
        content: content,
        description: description || ''
      })
    });
    
    const result = await response.json();
    console.log('[NotifyX] 發送结果:', result);
    return result.status === 'queued';
  } catch (error) {
    console.error('[NotifyX] 發送通知失敗:', error);
    return false;
  }
}

async function sendNotification(title, content, description, config) {
  if (config.NOTIFICATION_TYPE === 'notifyx') {
    return await sendNotifyXNotification(title, content, description, config);
  } else {
    return await sendTelegramNotification(content, config);
  }
}

// 定時檢查即將到期的訂閱 - 完全優化版
async function checkExpiringSubscriptions(env) {
  try {
    console.log('[定時任務] 開始檢查即將到期的訂閱: ' + new Date().toISOString());
    
    const subscriptions = await getAllSubscriptions(env);
    console.log('[定時任務] 共找到 ' + subscriptions.length + ' 個訂閱');
    
    const config = await getConfig(env);
    const now = new Date();
    const expiringSubscriptions = [];
    const updatedSubscriptions = [];
    let hasUpdates = false;
    
    for (const subscription of subscriptions) {
      if (subscription.isActive === false) {
        console.log('[定時任務] 訂閱 "' + subscription.name + '" 已停用，跳過');
        continue;
      }
      
      const expiryDate = new Date(subscription.currentPlan?.expiryDate || subscription.expiryDate);
      const daysDiff = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
      
      console.log('[定時任務] 訂閱 "' + subscription.name + '" 到期日期: ' + expiryDate.toISOString() + ', 剩餘天數: ' + daysDiff);
      
      // 修复提前提醒天數逻辑
      const reminderDays = subscription.reminderDays !== undefined ? subscription.reminderDays : 7;
      let shouldRemind = false;
      
      if (reminderDays === 0) {
        // 当提前提醒天數為0時，只在到期日当天提醒
        shouldRemind = daysDiff === 0;
      } else {
        // 当提前提醒天數大於0時，在指定范圍内提醒
        shouldRemind = daysDiff >= 0 && daysDiff <= reminderDays;
      }
      
      // 如果已過期，且設置了周期和自動續訂，则自動更新到下一個周期
      if (daysDiff < 0 && subscription.periodValue && subscription.periodUnit && subscription.autoRenew !== false) {
        console.log('[定時任務] 訂閱 "' + subscription.name + '" 已過期且啟用自動續訂，正在更新到下一個周期');
        
        const newExpiryDate = new Date(expiryDate);
        
        if (subscription.periodUnit === 'day') {
          newExpiryDate.setDate(expiryDate.getDate() + subscription.periodValue);
        } else if (subscription.periodUnit === 'month') {
          newExpiryDate.setMonth(expiryDate.getMonth() + subscription.periodValue);
        } else if (subscription.periodUnit === 'year') {
          newExpiryDate.setFullYear(expiryDate.getFullYear() + subscription.periodValue);
        }
        
        while (newExpiryDate < now) {
          console.log('[定時任務] 新计算的到期日期 ' + newExpiryDate.toISOString() + ' 仍然過期，继續计算下一個周期');
          
          if (subscription.periodUnit === 'day') {
            newExpiryDate.setDate(newExpiryDate.getDate() + subscription.periodValue);
          } else if (subscription.periodUnit === 'month') {
            newExpiryDate.setMonth(newExpiryDate.getMonth() + subscription.periodValue);
          } else if (subscription.periodUnit === 'year') {
            newExpiryDate.setFullYear(newExpiryDate.getFullYear() + subscription.periodValue);
          }
        }
        
        console.log('[定時任務] 訂閱 "' + subscription.name + '" 更新到期日期: ' + newExpiryDate.toISOString());
        
        const updatedSubscription = { 
          ...subscription, 
          currentPlan: {
            ...subscription.currentPlan,
            expiryDate: newExpiryDate.toISOString()
          }
        };
        updatedSubscriptions.push(updatedSubscription);
        hasUpdates = true;
        
        const newDaysDiff = Math.ceil((newExpiryDate - now) / (1000 * 60 * 60 * 24));
        
        let shouldRemindAfterRenewal = false;
        if (reminderDays === 0) {
          shouldRemindAfterRenewal = newDaysDiff === 0;
        } else {
          shouldRemindAfterRenewal = newDaysDiff >= 0 && newDaysDiff <= reminderDays;
        }
        
        if (shouldRemindAfterRenewal) {
          console.log('[定時任務] 訂閱 "' + subscription.name + '" 在提醒范圍内，將發送通知');
          expiringSubscriptions.push({
            ...updatedSubscription,
            daysRemaining: newDaysDiff
          });
        }
      } else if (daysDiff < 0 && subscription.autoRenew === false) {
        console.log('[定時任務] 訂閱 "' + subscription.name + '" 已過期且未啟用自動續訂，將發送過期通知');
        expiringSubscriptions.push({
          ...subscription,
          daysRemaining: daysDiff
        });
      } else if (shouldRemind) {
        console.log('[定時任務] 訂閱 "' + subscription.name + '" 在提醒范圍内，將發送通知');
        expiringSubscriptions.push({
          ...subscription,
          daysRemaining: daysDiff
        });
      }
    }
    
    if (hasUpdates) {
      console.log('[定時任務] 有 ' + updatedSubscriptions.length + ' 個訂閱需要更新到下一個周期');
      
      const mergedSubscriptions = subscriptions.map(sub => {
        const updated = updatedSubscriptions.find(u => u.id === sub.id);
        return updated || sub;
      });
      
      await env.SUBSCRIPTIONS_KV.put('subscriptions', JSON.stringify(mergedSubscriptions));
      console.log('[定時任務] 已更新訂閱列表');
    }
    
    if (expiringSubscriptions.length > 0) {
      console.log('[定時任務] 有 ' + expiringSubscriptions.length + ' 個訂閱需要發送通知');
      
      let commonContent = '';
      expiringSubscriptions.sort((a, b) => a.daysRemaining - b.daysRemaining);

      for (const sub of expiringSubscriptions) {
        const typeText = sub.customType || '其他';
        const periodText = (sub.periodValue && sub.periodUnit) ? `(周期: ${sub.periodValue} ${ { day: '天', month: '月', year: '年' }[sub.periodUnit] || sub.periodUnit})` : '';
        
        let statusText;
        if (sub.daysRemaining === 0) statusText = `⚠️ **${sub.name}** (${typeText}) ${periodText} 今天到期！`;
        else if (sub.daysRemaining < 0) statusText = `🚨 **${sub.name}** (${typeText}) ${periodText} 已過期 ${Math.abs(sub.daysRemaining)} 天`;
        else statusText = `📅 **${sub.name}** (${typeText}) ${periodText} 將在 ${sub.daysRemaining} 天後到期`;

        if (sub.notes) statusText += `\n   備注: ${sub.notes}`;
        if (sub.currentPlan?.price || sub.price) statusText += `\n   價格: ${(sub.currentPlan?.price || sub.price).toFixed(2)} ${sub.currentPlan?.currency || sub.currency || 'TWD'}`;
        commonContent += statusText + '\n\n';
      }
      
      await sendNotificationToAllChannels(title, commonContent, config, logPrefix);

    } else {
      console.log('[定時任務] 没有需要提醒的訂閱');
    }
    
    console.log('[定時任務] 檢查完成');
  } catch (error) {
    console.error('[定時任務] 檢查即將到期的訂閱失敗:', error);
  }
}

function getCookieValue(cookieString, key) {
  if (!cookieString) return null;
  
  const match = cookieString.match(new RegExp('(^| )' + key + '=([^;]+)'));
  return match ? match[2] : null;
}

async function handleRequest(request, env, ctx) {
  return new Response(loginPage, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

const CryptoJS = {
  HmacSHA256: function(message, key) {
    const keyData = new TextEncoder().encode(key);
    const messageData = new TextEncoder().encode(message);
    
    return Promise.resolve().then(() => {
      return crypto.subtle.importKey(
        "raw", 
        keyData,
        { name: "HMAC", hash: {name: "SHA-256"} },
        false,
        ["sign"]
      );
    }).then(cryptoKey => {
      return crypto.subtle.sign(
        "HMAC",
        cryptoKey,
        messageData
      );
    }).then(buffer => {
      const hashArray = Array.from(new Uint8Array(buffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    });
  }
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (url.pathname.startsWith('/api')) {
      return api.handleRequest(request, env, ctx);
    } else if (url.pathname.startsWith('/admin')) {
      return admin.handleRequest(request, env, ctx);
    } else {
      return handleRequest(request, env, ctx);
    }
  },
  
  async scheduled(event, env, ctx) {
    console.log('[Workers] 定時任務觸發時間:', new Date().toISOString());
    await checkExpiringSubscriptions(env);
  }
};