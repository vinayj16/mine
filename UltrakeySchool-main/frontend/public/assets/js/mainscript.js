/*
Author       : Dreamguys
Template Name: Ultrakey - Bootstrap Template
*/

$(document).ready(function(){

	// Mobile Menu Js
	$('#mobile-menu').meanmenu({
		meanMenuContainer: '.mobile-menu',
		meanScreenWidth: "1199",
		meanExpand: ['<i class="ti ti-plus"></i>'],
	});

	// Sidebar Toggle Js
	$(".offcanvas-close,.offcanvas-overlay").on("click", function() {
		$(".offcanvas-info").removeClass("show");
		$(".offcanvas-overlay").removeClass("overlay-open");
	});
	$(".sidebar-menu").on("click", function() {
		$(".offcanvas-info").addClass("show");
		$(".offcanvas-overlay").addClass("overlay-open");
	});

	// Body Overlay Js
	$(".body-overlay").on("click", function() {
		$(".offcanvas__area").removeClass("offcanvas-opened");
		$(".df-search-area").removeClass("opened");
		$(".body-overlay").removeClass("opened");
	});

//Loader
$("#global-loader").fadeOut("slow");

	if ($(window).width() <= 991) {
		var Sidemenu = function () {
			this.$menuItem = $('.main-nav a');
		};
	
		function init() {
			var $this = Sidemenu;
			$('.main-nav a').on('click', function (e) {
				if ($(this).parent().hasClass('has-submenu')) {
					e.preventDefault();
				}
				if (!$(this).hasClass('submenu')) {
					$('ul', $(this).parents('ul:first')).slideUp(350);
					$('a', $(this).parents('ul:first')).removeClass('submenu');
					$(this).next('ul').slideDown(350);
					$(this).addClass('submenu');
				} else if ($(this).hasClass('submenu')) {
					$(this).removeClass('submenu');
					$(this).next('ul').slideUp(350);
				}
			});
		}
	
		// Sidebar Initiate
		init();
	}

	// Sticky Header

	$(window).scroll(function() {
		if ($(this).scrollTop() > 200) {
			$("header").addClass("fixed");
		} else {
			$("header").removeClass("fixed");
		}
	});

	new WOW().init();

	// Accordion class

	$('.accordion-item .collapse').on('show.bs.collapse', function () {
        $(this).parent().addClass('show');
      });

      $('.accordion-item .collapse').on('hide.bs.collapse', function () {
        $(this).parent().removeClass('show');
    });

	// Scroll Top

	$(window).scroll(function() { 
        var scroll = $(window).scrollTop();
        if (scroll >= 500) {
         $(".back-to-top-icon").addClass("show");
        } else {
         $(".back-to-top-icon").removeClass("show");
        }
     });

});

//Review slider
	
if($('.review-slider').length > 0) {
	$('.review-slider').owlCarousel({
		loop:true,
		margin:24,
		nav:true,
		dots:false,
		smartSpeed: 2000,
		autoplay:true,
		navText: [
			'<i class="fas fa-chevron-left"></i>',
			'<i class="fas fa-chevron-right"></i>'
		],
		responsive:{
			0:{
				items:1
			},				
			550:{
				items:1
			},
			700:{
				items:2
			},
			1000:{
				items:3
			}
		}
	})
}


jQuery(document).ready(function($){
	if (window!=window.top) {
		window.top.location.href = window.location.href;
	}
});
