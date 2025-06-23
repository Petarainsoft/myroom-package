# MyRoom Embed Service - Quick Start

Integrate 3D avatar rooms into your website easily.

## 🚀 Demo URLs

- **Main Demo**: `http://localhost:5173/`
- **Embed Demo**: `http://localhost:5173/embed-demo.html`
- **Web Component Demo**: `http://localhost:5173/webcomponent-demo.html`

## 📋 Integration Methods

### Method 1: iframe (Simple)

```html
<iframe 
  src="http://localhost:5173/embed-demo.html?room=cate001&gender=female&width=800&height=600" 
  width="800" 
  height="600" 
  frameborder="0">
</iframe>
```

### Method 2: JavaScript API (Advanced)

```html
<div id="myroom-container"></div>
<script src="http://localhost:5173/myroom-embed.js"></script>
<script>
  MyRoom.create({
    container: '#myroom-container',
    room: 'cate001',
    gender: 'female',
    width: 800,
    height: 600,
    onReady: function(scene) {
      console.log('MyRoom ready!', scene);
    }
  });
</script>
```

## 🔧 Parameters

| Parameter | Default | Description | Example |
|-----------|---------|-------------|----------|
| `room` | `cate001` | Room model ID | `room=cate001` |
| `gender` | `female` | Avatar gender (`male`/`female`) | `gender=male` |
| `width` | `800px` | Container width | `width=100%` |
| `height` | `600px` | Container height | `height=400px` |
| `autoplay` | `true` | Auto start scene | `autoplay=false` |
| `controls` | `true` | Show UI controls | `controls=false` |
| `camera` | `true` | Enable camera controls | `camera=false` |

## 📝 Examples

```html
<!-- Basic room -->
<iframe src="http://localhost:5173/embed-demo.html?room=cate001&gender=female"></iframe>

<!-- Custom size -->
<iframe 
  src="http://localhost:5173/embed-demo.html?width=1200&height=800" 
  width="1200" height="800">
</iframe>

<!-- No controls -->
<iframe src="http://localhost:5173/embed-demo.html?controls=false&camera=false"></iframe>
```

## 🔗 Communication API

### Send Messages

```javascript
const iframe = document.querySelector('iframe');

// Change avatar
iframe.contentWindow.postMessage({
  type: 'changeAvatar',
  data: { gender: 'male' }
}, '*');

// Reset camera
iframe.contentWindow.postMessage({ type: 'resetCamera' }, '*');
```

### Listen to Events

```javascript
window.addEventListener('message', function(event) {
  if (event.data.source === 'myroom') {
    switch(event.data.type) {
      case 'sceneReady':
        console.log('MyRoom ready!');
        break;
      case 'avatarChanged':
        console.log('Avatar changed:', event.data.config);
        break;
    }
  }
});
```

## 🔒 Security & Mobile

### Security
- Use HTTPS in production
- Validate parameters server-side
- Implement rate limiting
- Use CSP headers

### Mobile Support
- ✅ iOS Safari 12+, Chrome Mobile 70+, Samsung Internet 10+, Firefox Mobile 68+

```html
<!-- Responsive iframe -->
<iframe 
  src="http://localhost:5173/embed-demo.html?width=100%&height=400px" 
  style="width: 100%; height: 400px; max-width: 800px;"
  frameborder="0">
</iframe>
```

## 🎨 Customization

```css
/* Responsive container */
.myroom-container {
  width: 100%;
  max-width: 1200px;
  aspect-ratio: 4/3;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.myroom-container iframe {
  width: 100%;
  height: 100%;
  border: none;
}

@media (max-width: 768px) {
  .myroom-container { aspect-ratio: 1/1; }
}
```

<!-- ## 🚀 Production Setup

1. Replace `localhost:5173` with your domain
2. Configure HTTPS and SSL
3. Set up CDN for faster loading
4. Add error tracking and monitoring
5. Test across devices and browsers

## 📞 Support

- 📧 Email: support@myroom.com
- 📖 Docs: [Full Documentation](https://docs.myroom.com)
- 🐛 Issues: [Report bugs](https://github.com/myroom/issues) -->

---
**Start with iframe for quick testing, upgrade to JavaScript API for advanced features!**