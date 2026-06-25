// 购物车交互 - 特色蛋品行
document.addEventListener('DOMContentLoaded', function() {
  // Quantity input validation
  var qtyInputs = document.querySelectorAll('.qty-input, .qty-input-sm');
  qtyInputs.forEach(function(input) {
    input.addEventListener('change', function() {
      var min = parseFloat(this.getAttribute('min')) || 1;
      var val = parseFloat(this.value);
      if (isNaN(val) || val < min) {
        this.value = min;
      }
    });
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});