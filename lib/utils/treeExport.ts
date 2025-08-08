import { jsPDF } from "jspdf";

export interface ExportOptions {
  svgId: string;
  isDarkMode: boolean;
  format: 'png' | 'pdf';
  filename?: string;
  includeBackground?: boolean;
  backgroundColor?: string;
}

interface ColorMap {
  [key: string]: string;
}

/**
 * Get computed CSS color values for both light and dark modes
 */
function getColorMaps(isDarkMode: boolean): ColorMap {
  const colors: ColorMap = {};
  
  // Define color mappings based on globals.css
  if (isDarkMode) {
    colors['--background'] = '#0F1419';
    colors['--foreground'] = '#F9F3EF';
    colors['--primary'] = '#D2C1B6';
    colors['--secondary'] = '#456882';
    colors['--male-color'] = '#D2C1B6';
    colors['--female-color'] = '#F9F3EF';
    colors['--link-color'] = '#D2C1B6';
    colors['--border'] = '#456882';
    colors['--ring'] = '#D2C1B6';
  } else {
    colors['--background'] = '#F9F3EF';
    colors['--foreground'] = '#1B3C53';
    colors['--primary'] = '#1B3C53';
    colors['--secondary'] = '#456882';
    colors['--male-color'] = '#1B3C53';
    colors['--female-color'] = '#456882';
    colors['--link-color'] = '#1B3C53';
    colors['--border'] = '#D2C1B6';
    colors['--ring'] = '#1B3C53';
  }
  
  return colors;
}

/**
 * Convert HSL color to hex
 */
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Parse HSL string and convert to hex
 */
function parseHslToHex(hslString: string): string {
  const match = hslString.match(/hsl\(\s*(\d+)\s*,?\s*(\d+)%?\s*,?\s*(\d+)%?\s*\)/);
  if (match) {
    const h = parseInt(match[1]);
    const s = parseInt(match[2]);
    const l = parseInt(match[3]);
    return hslToHex(h, s, l);
  }
  return hslString; // Return original if parsing fails
}

/**
 * Resolve CSS custom properties to actual color values
 */
function resolveColor(colorValue: string, colorMap: ColorMap): string {
  if (colorValue.startsWith('hsl(var(')) {
    // Handle hsl(var(--color-name) / opacity) format
    const varMatch = colorValue.match(/hsl\(var\((--[^)]+)\)(?:\s*\/\s*[\d.]+)?\)/);
    if (varMatch && colorMap[varMatch[1]]) {
      return colorMap[varMatch[1]];
    }
  }
  
  if (colorValue.startsWith('var(')) {
    // Handle var(--color-name) format
    const varMatch = colorValue.match(/var\((--[^)]+)\)/);
    if (varMatch && colorMap[varMatch[1]]) {
      return colorMap[varMatch[1]];
    }
  }
  
  if (colorValue.startsWith('hsl(') && !colorValue.includes('var(')) {
    // Handle direct HSL values
    return parseHslToHex(colorValue);
  }
  
  return colorValue;
}

/**
 * Get Tailwind color mappings
 */
function getTailwindColors(isDarkMode: boolean): ColorMap {
  const colorMap = getColorMaps(isDarkMode);
  
  return {
    // Background classes
    'bg-tree-male': colorMap['--male-color'],
    'bg-tree-female': colorMap['--female-color'],
    'bg-primary': colorMap['--primary'],
    'bg-secondary': colorMap['--secondary'],
    'bg-background': colorMap['--background'],
    'bg-white': '#FFFFFF',
    'bg-gray-50': '#F9FAFB',
    'bg-gray-100': '#F3F4F6',
    'bg-gray-200': '#E5E7EB',
    'bg-gray-700': '#374151',
    'bg-gray-800': '#1F2937',
    'bg-gray-900': '#111827',
    
    // Border classes
    'border-tree-male': colorMap['--male-color'],
    'border-tree-female': colorMap['--female-color'],
    'border-primary': colorMap['--primary'],
    'border-ring': colorMap['--ring'],
    'border-gray-200': '#E5E7EB',
    'border-gray-300': '#D1D5DB',
    
    // Text colors
    'text-white': '#FFFFFF',
    'text-gray-100': '#F3F4F6',
    'text-gray-600': '#4B5563',
    'text-gray-700': '#374151',
    'text-gray-800': '#1F2937',
    'text-gray-900': '#111827',
    'text-foreground': colorMap['--foreground'],
    
    // Stroke colors for SVG
    'stroke-tree-link': colorMap['--link-color'],
    'stroke-primary': colorMap['--primary'],
  };
}

/**
 * Inline styles for SVG elements to ensure proper rendering in export
 */
function inlineStyles(svgClone: SVGElement, isDarkMode: boolean): void {
  const colorMap = getColorMaps(isDarkMode);
  const tailwindColors = getTailwindColors(isDarkMode);
  
  // Helper to apply styles to an element
  const applyStyles = (element: Element) => {
    const classList = Array.from(element.classList);
    const computedStyle = window.getComputedStyle(element);
    
    // Handle background colors
    const bgClass = classList.find(cls => cls.startsWith('bg-'));
    if (bgClass && tailwindColors[bgClass]) {
      element.setAttribute('fill', tailwindColors[bgClass]);
    }
    
    // Handle border colors for foreignObject divs
    const borderClass = classList.find(cls => cls.startsWith('border-'));
    if (borderClass && tailwindColors[borderClass]) {
      if (element.tagName === 'rect' || element.tagName === 'circle') {
        element.setAttribute('stroke', tailwindColors[borderClass]);
      }
    }
    
    // Handle text colors
    const textClass = classList.find(cls => cls.startsWith('text-'));
    if (textClass && tailwindColors[textClass]) {
      element.setAttribute('fill', tailwindColors[textClass]);
    }
    
    // For SVG path elements, ensure stroke is set
    if (element.tagName === 'path') {
      const currentStroke = element.getAttribute('stroke');
      if (currentStroke && (currentStroke.includes('var(') || currentStroke.includes('hsl('))) {
        const resolvedColor = resolveColor(currentStroke, colorMap);
        element.setAttribute('stroke', resolvedColor);
      }
    }
    
    // For foreignObject elements, we need to handle the HTML content differently
    if (element.tagName === 'foreignObject') {
      const htmlElements = element.querySelectorAll('*');
      htmlElements.forEach((htmlEl) => {
        const htmlClassList = Array.from(htmlEl.classList);
        
        // Convert Tailwind classes to inline styles
        const bgClass = htmlClassList.find(cls => cls.startsWith('bg-'));
        if (bgClass && tailwindColors[bgClass]) {
          (htmlEl as HTMLElement).style.backgroundColor = tailwindColors[bgClass];
        }
        
        const textClass = htmlClassList.find(cls => cls.startsWith('text-'));
        if (textClass && tailwindColors[textClass]) {
          (htmlEl as HTMLElement).style.color = tailwindColors[textClass];
        }
        
        const borderClass = htmlClassList.find(cls => cls.startsWith('border-'));
        if (borderClass && tailwindColors[borderClass]) {
          (htmlEl as HTMLElement).style.borderColor = tailwindColors[borderClass];
        }
        
        // Handle computed styles that use CSS custom properties
        const style = window.getComputedStyle(htmlEl);
        if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          (htmlEl as HTMLElement).style.backgroundColor = style.backgroundColor;
        }
        if (style.color && style.color !== 'rgb(0, 0, 0)') {
          (htmlEl as HTMLElement).style.color = style.color;
        }
        if (style.borderColor && style.borderColor !== 'rgb(0, 0, 0)') {
          (htmlEl as HTMLElement).style.borderColor = style.borderColor;
        }
      });
    }
  };
  
  // Apply styles to all elements
  const allElements = svgClone.querySelectorAll('*');
  allElements.forEach(applyStyles);
  
  // Handle the root SVG background
  svgClone.setAttribute('style', `background: ${colorMap['--background']}`);
}

/**
 * Handle images in the SVG - inline them or remove if missing
 * TEMPORARILY DISABLED - Images are causing export issues
 */
async function processImages(svgClone: SVGElement): Promise<void> {
  // TEMPORARILY COMMENTED OUT - Image processing disabled
  /*
  const images = svgClone.querySelectorAll("image");
  const foreignObjects = svgClone.querySelectorAll("foreignObject");
  
  const promises: Promise<void>[] = [];
  
  // Handle SVG <image> elements
  images.forEach((img) => {
    const href = img.getAttribute("href") || img.getAttribute("xlink:href");
    if (href && !href.startsWith("data:")) {
      promises.push(
        fetch(href)
          .then((res) => res.blob())
          .then((blob) => {
            return new Promise<void>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                img.setAttribute("href", reader.result as string);
                resolve();
              };
              reader.onerror = () => {
                // Remove the image if it fails to load
                img.remove();
                resolve();
              };
              reader.readAsDataURL(blob);
            });
          })
          .catch(() => {
            // Remove problematic image
            img.remove();
          })
      );
    }
  });
  
  // Handle HTML img elements inside foreignObject
  foreignObjects.forEach((foreignObj) => {
    const htmlImages = foreignObj.querySelectorAll("img");
    htmlImages.forEach((htmlImg) => {
      const src = htmlImg.getAttribute("src");
      if (src && !src.startsWith("data:")) {
        promises.push(
          fetch(src)
            .then((res) => res.blob())
            .then((blob) => {
              return new Promise<void>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  htmlImg.setAttribute("src", reader.result as string);
                  resolve();
                };
                reader.onerror = () => {
                  // Remove the entire foreignObject if image fails
                  foreignObj.remove();
                  resolve();
                };
                reader.readAsDataURL(blob);
              });
            })
            .catch(() => {
              // Remove the entire foreignObject containing the failed image
              foreignObj.remove();
            })
        );
      } else if (!src || src === '' || src === 'undefined') {
        // Remove foreignObject with missing/invalid image sources
        foreignObj.remove();
      }
    });
  });
  
  await Promise.all(promises);
  */
  
  // Instead, just remove all images to prevent export issues
  const images = svgClone.querySelectorAll("image");
  images.forEach((img) => img.remove());
  
  // Also remove img elements inside foreignObjects
  const foreignObjects = svgClone.querySelectorAll("foreignObject");
  foreignObjects.forEach((foreignObj) => {
    const htmlImages = foreignObj.querySelectorAll("img");
    htmlImages.forEach((htmlImg) => htmlImg.remove());
  });
}

/**
 * Main export function
 */
export async function exportTreeSvg(options: ExportOptions): Promise<boolean> {
  try {
    const { 
      svgId, 
      isDarkMode, 
      format, 
      filename = `family-tree-${Date.now()}`,
      includeBackground = true,
      backgroundColor 
    } = options;
    
    const svgElement = document.getElementById(svgId);
    if (!svgElement || !(svgElement instanceof SVGElement)) {
      console.error("SVG element not found for export:", svgId);
      return false;
    }
    const svg = svgElement;

    // Clone the SVG to avoid modifying the original
    const svgClone = svg.cloneNode(true) as SVGElement;
    
    // Process images first - inline them or remove if missing
    await processImages(svgClone);
    
    // Inline all styles to ensure proper rendering
    inlineStyles(svgClone, isDarkMode);
    
    // Serialize the processed SVG
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgClone);
    
    // Create a clean SVG data URL
    const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
    
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    
    return new Promise((resolve) => {
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = svg.clientWidth || 800;
          canvas.height = svg.clientHeight || 600;
          const ctx = canvas.getContext("2d", { willReadFrequently: false });
          
          if (!ctx) {
            console.error("Failed to get canvas context");
            resolve(false);
            return;
          }
          
          // Fill background if requested
          if (includeBackground) {
            ctx.fillStyle = backgroundColor || (isDarkMode ? "#18181b" : "#f9fafb");
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          
          // Draw the SVG image
          ctx.drawImage(img, 0, 0);
          
          if (format === "png") {
            const dataUrl = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = `${filename}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            resolve(true);
          } else {
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({
              orientation: "landscape",
              unit: "px",
              format: [canvas.width, canvas.height],
            });
            pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
            pdf.save(`${filename}.pdf`);
            resolve(true);
          }
        } catch (error) {
          console.error("Error during canvas export:", error);
          // Fallback: download SVG directly
          const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
          const svgUrl = URL.createObjectURL(svgBlob);
          const link = document.createElement("a");
          link.href = svgUrl;
          link.download = `${filename}.svg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(svgUrl);
          resolve(true);
        }
      };
      
      img.onerror = () => {
        console.error("Failed to load SVG image for export");
        // Fallback: download SVG directly
        const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
        const svgUrl = URL.createObjectURL(svgBlob);
        const link = document.createElement("a");
        link.href = svgUrl;
        link.download = `${filename}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(svgUrl);
        resolve(true);
      };
      
      img.src = svgDataUrl;
    });
    
  } catch (error) {
    console.error("Export failed:", error);
    return false;
  }
}

/**
 * Convenience function for PNG export
 */
export async function exportTreeAsPng(svgId: string, isDarkMode: boolean, filename?: string): Promise<boolean> {
  return exportTreeSvg({
    svgId,
    isDarkMode,
    format: 'png',
    filename,
  });
}

/**
 * Convenience function for PDF export
 */
export async function exportTreeAsPdf(svgId: string, isDarkMode: boolean, filename?: string): Promise<boolean> {
  return exportTreeSvg({
    svgId,
    isDarkMode,
    format: 'pdf',
    filename,
  });
}