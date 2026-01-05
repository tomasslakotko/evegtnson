(function() {
  'use strict';
  
  // Widget configuration
  const config = {
    apiUrl: window.location.origin + '/api/widget/event-type',
    widgetUrl: window.location.origin + '/widget'
  };

  // Create widget container
  function createWidget(identifier, slug, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Container element not found:', containerId);
      return;
    }

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.src = `${config.widgetUrl}/${encodeURIComponent(identifier)}/${encodeURIComponent(slug)}`;
    iframe.style.width = '100%';
    iframe.style.minHeight = '600px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '8px';
    iframe.style.backgroundColor = 'transparent';
    iframe.setAttribute('scrolling', 'no');
    
    // Handle iframe resize
    window.addEventListener('message', function(event) {
      if (event.data.type === 'widget-resize' && event.data.height) {
        iframe.style.height = event.data.height + 'px';
      }
    });

    container.appendChild(iframe);
  }

  // Auto-initialize widgets on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      const widgets = document.querySelectorAll('[data-booking-widget]');
      widgets.forEach(function(widget) {
        const identifier = widget.getAttribute('data-identifier');
        const slug = widget.getAttribute('data-slug');
        const containerId = widget.id || 'booking-widget-' + Math.random().toString(36).substr(2, 9);
        
        if (!widget.id) {
          widget.id = containerId;
        }
        
        if (identifier && slug) {
          createWidget(identifier, slug, containerId);
        } else {
          console.error('Missing data-identifier or data-slug attribute');
        }
      });
    });
  } else {
    const widgets = document.querySelectorAll('[data-booking-widget]');
    widgets.forEach(function(widget) {
      const identifier = widget.getAttribute('data-identifier');
      const slug = widget.getAttribute('data-slug');
      const containerId = widget.id || 'booking-widget-' + Math.random().toString(36).substr(2, 9);
      
      if (!widget.id) {
        widget.id = containerId;
      }
      
      if (identifier && slug) {
        createWidget(identifier, slug, containerId);
      } else {
        console.error('Missing data-identifier or data-slug attribute');
      }
    });
  }

  // Export for manual initialization
  window.BookingWidget = {
    init: function(identifier, slug, containerId) {
      createWidget(identifier, slug, containerId);
    }
  };
})();

