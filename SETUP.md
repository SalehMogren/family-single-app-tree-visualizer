# Family Tree App Setup Guide

## 🚀 Quick Start

This family tree application is ready to run out of the box with demo data and placeholder configurations.

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm

### Installation
\`\`\`bash
# Clone or download the project
# Navigate to project directory
npm install
# or
yarn install
# or
pnpm install
\`\`\`

### Run Development Server
\`\`\`bash
npm run dev
# or
yarn dev
# or
pnpm dev
\`\`\`

Visit `http://localhost:3000` to see your family tree application.

## 📁 Project Structure

\`\`\`
├── app/                    # Next.js app directory
│   ├── tree-editor/       # Tree editor page
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── family-tree.tsx    # Main tree visualization
│   ├── timeline-view.tsx  # Timeline component
│   ├── image-upload.tsx   # Image upload component
│   └── ui/               # UI components
├── public/
│   ├── data/             # Family data
│   └── config/           # Configuration files
├── lib/                  # Utility functions
└── hooks/               # Custom React hooks
\`\`\`

## 🔧 Configuration

### Family Data
Edit `public/data/family-data.json` to customize your family tree structure.

### App Settings
Modify `public/config/app-config.json` for general app settings.

### Timeline Events
Update `public/config/timeline-events.json` to add family historical events.

### Theme Customization
Edit `public/config/theme.json` to change colors and styling.

## 🌟 Features

### ✅ Current Features
- Interactive family tree visualization
- Drag and zoom functionality
- Dark/light mode support
- Responsive design
- RTL (Arabic) support
- Tree editor with full CRUD operations
- Image upload (demo mode with placeholders)
- Export tree as PNG/PDF
- Timeline view for family events
- Configurable themes and settings

### 🎯 Tree Editor Features
- Add/edit/delete family members
- Upload member photos (URL or file upload)
- Export/import family data as JSON
- Real-time tree updates

### 📤 Export Features
- PNG export with high resolution
- PDF export (converts to PNG)
- Full tree capture including all nodes
- Customizable background colors

### 🖼️ Image Support
- URL-based images (permanent)
- File upload (demo mode - temporary)
- Automatic image validation
- Responsive image display in tree nodes

## 🔄 Production Setup

### Image Upload (Cloudinary)
For production image uploads, replace placeholder values in `lib/cloudinary.ts`:

\`\`\`typescript
const CLOUDINARY_CONFIG = {
  cloudName: 'your-cloud-name',
  uploadPreset: 'your-upload-preset', 
  apiKey: 'your-api-key'
}
\`\`\`

### Environment Variables
Create `.env.local` file:
\`\`\`
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
NEXT_PUBLIC_CLOUDINARY_API_KEY=your-api-key
\`\`\`

## 🎨 Customization

### Adding New Family Members
1. Use the Tree Editor at `/tree-editor`
2. Or manually edit `public/data/family-data.json`

### Styling
- Modify theme colors in `public/config/theme.json`
- Update CSS in `app/globals.css`
- Customize component styles in individual component files

### Adding Timeline Events
Edit `public/config/timeline-events.json` to add historical family events.

## 🚀 Deployment

### Vercel (Recommended)
\`\`\`bash
npm run build
# Deploy to Vercel
\`\`\`

### Other Platforms
\`\`\`bash
npm run build
npm start
\`\`\`

## 📱 Mobile Support

The application is fully responsive and works on:
- Desktop browsers
- Tablets
- Mobile devices
- Touch interfaces with gesture support

## 🌐 Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🔧 Troubleshooting

### Common Issues

1. **Images not loading**: Check image URLs or use the file upload feature
2. **Export not working**: Ensure browser supports canvas and blob downloads
3. **Tree not rendering**: Check family data JSON format
4. **Performance issues**: Reduce tree size or optimize images

### Debug Mode
Add `?debug=true` to URL for additional console logging.

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check this setup guide
2. Review the code comments
3. Test with demo data first
4. Ensure all dependencies are installed

---

**Happy Family Tree Building! 🌳👨‍👩‍👧‍👦**
