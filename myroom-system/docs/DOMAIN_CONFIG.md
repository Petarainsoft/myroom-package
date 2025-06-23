# Domain Configuration

Configure MyRoom service to load from different domains by updating `config-domain.js`.

## Quick Setup

1. **Find the file**: `config-domain.js` (root) or `dist/config-domain.js` (after build)
2. **Update domain**:

```javascript
// config-domain.js
window.MyRoomConfig = {
  baseDomain: 'https://your-domain.com'  // Change this
};
```

## Common Configurations

```javascript
// Production
window.MyRoomConfig = {
  baseDomain: 'https://myroom.example.com'
};

// Local development
window.MyRoomConfig = {
  baseDomain: 'http://localhost:3000'
};

// CDN
window.MyRoomConfig = {
  baseDomain: 'https://cdn.myroom.com'
};
```

## Requirements

- Target domain must have `myroom-webcomponent.es.js` file
- CORS headers properly configured
- Use HTTPS in production
- Same file structure as original

## Troubleshooting

| Error | Solution |
|-------|----------|
| 404 Not Found | Check file exists at target domain |
| CORS Error | Configure CORS headers on target server |
| Mixed Content | Use HTTPS for both domains |
| Network Error | Verify domain is accessible |

## Testing

1. Update `config-domain.js`
2. Reload application
3. Check browser console for errors
4. Test MyRoom component functionality