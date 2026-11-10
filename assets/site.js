(function(){
function swap(prefixBtn,prefixPane){
 var btns=document.querySelectorAll('[data-'+prefixBtn+']');
 btns.forEach(function(b){b.addEventListener('click',function(){
  var i=b.getAttribute('data-'+prefixBtn);
  btns.forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});
  document.querySelectorAll('[data-'+prefixPane+']').forEach(function(p){p.hidden=p.getAttribute('data-'+prefixPane)!==i});
 })});
}
swap('go','step');swap('qgo','qa');
var h=document.querySelector('.ps-header'),b=document.querySelector('.ps-burger');
if(h&&b){b.setAttribute('aria-expanded','false');b.addEventListener('click',function(){var o=h.classList.toggle('is-open');b.setAttribute('aria-expanded',String(o))})}
})();