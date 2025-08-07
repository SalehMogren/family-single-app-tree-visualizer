# Family Tree App - Open Source Template

A modern, configurable family tree application built with Next.js, React, and D3.js. Perfect for creating beautiful, interactive family trees with Arabic RTL support.

## 🌟 Features

- **Interactive Family Tree**: Zoom, pan, and explore your family connections
- **Configurable Design**: Customize colors, fonts, and layouts via JSON files
- **Feature Toggles**: Enable/disable features like family history, stats, achievements
- **RTL Support**: Full Arabic language and right-to-left layout support
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Dark/Light Mode**: Toggle between themes
- **Export Ready**: Extensible for PDF/PNG export functionality

## 🚀 Quick Start

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/your-username/family-tree-app.git
   cd family-tree-app
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Configure your family data**
   - Edit `public/data/family-data.json` with your family information
   - Customize `public/config/family-brief.json` with your family's story
   - Update `public/config/footer-config.json` with contact information

4. **Customize the theme**
   - Modify `public/config/theme.json` to match your preferred colors and fonts
   - Toggle features in `public/config/app-config.json`

5. **Run the development server**
   \`\`\`bash
   npm run dev
   \`\`\`

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 📁 Configuration Files

### App Configuration (`public/config/app-config.json`)
Control which features are enabled:
\`\`\`json
{
  "features": {
    "familyHistory": true,
    "familyStats": true,
    "familyGeo": true,
    "familyAchievements": true,
    "treeSettings": true,
    "darkMode": true
  }
}
\`\`\`

### Theme Configuration (`public/config/theme.json`)
Customize colors, fonts, and styling:
\`\`\`json
{
  "colors": {
    "light": {
      "primary": "#2563eb",
      "secondary": "#1d4ed8",
      "maleColor": "#1E40AF",
      "femaleColor": "#BE185D"
    }
  }
}
\`\`\`

### Family Data (`public/data/family-data.json`)
Your family tree structure:
\`\`\`json
{
  "name": "أحمد محمد فلان",
  "gender": "male",
  "birth_year": 1920,
  "spouse": "فاطمة علي السالم",
  "children": [...]
}
\`\`\`

## 🎨 Customization

### Adding New Features
1. Add feature toggle to `app-config.json`
2. Check feature status in components using `useAppConfig()`
3. Conditionally render based on configuration

### Styling
- All colors are defined in `theme.json`
- Components use theme colors dynamically
- Easy to create new color schemes

### Fonts
- Configure font families in `theme.json`
- Supports Arabic fonts like Raqaa One, Amiri, Noto Sans Arabic

## 🔧 Development

### Project Structure
\`\`\`
├── public/
│   ├── config/          # Configuration files
│   └── data/           # Family data
├── components/         # React components
├── hooks/             # Custom hooks
├── lib/               # Utilities and types
└── app/               # Next.js app directory
\`\`\`

### Key Components
- `FamilyTree`: Interactive D3.js tree visualization
- `FamilyBrief`: Family history and information
- `Navbar`: Navigation with feature toggles
- `Footer`: Contact and statistics

### Custom Hooks
- `useAppConfig()`: Load app configuration
- `useFamilyBrief()`: Load family information
- `useTheme()`: Load theme settings

## 📱 Responsive Design

The app is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- Different screen orientations

## 🌐 Internationalization

Currently supports:
- Arabic (RTL)
- Easy to extend for other languages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this template for your family tree projects!

## 🆘 Support

- Create an issue for bugs or feature requests
- Check the documentation for configuration help
- Join our community discussions

## 🎯 Roadmap

- [ ] PDF/PNG export functionality
- [ ] Family member editing interface
- [ ] Photo upload support
- [ ] Timeline view
- [ ] Search and filter capabilities
- [ ] Multi-language support
- [ ] Cloud storage integration

---

Made with ❤️ for preserving family histories
