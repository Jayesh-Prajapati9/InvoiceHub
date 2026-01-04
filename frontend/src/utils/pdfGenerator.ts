import html2pdf from 'html2pdf.js';

/**
 * Generate and download PDF from HTML content
 * @param htmlContent - The HTML content to convert to PDF
 * @param filename - The filename for the downloaded PDF (without .pdf extension)
 */
export const generatePDF = async (htmlContent: string, filename: string): Promise<void> => {
  try {
    // Create a wrapper container to center the content
    const wrapper = document.createElement('div');
    wrapper.style.width = '210mm';
    wrapper.style.margin = '0 auto';
    wrapper.style.display = 'block';
    wrapper.style.background = 'white';
    wrapper.style.position = 'relative';
    wrapper.style.overflow = 'visible';
    
    // Create a temporary container for the HTML
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    element.style.width = '210mm';
    element.style.maxWidth = '210mm';
    element.style.height = 'auto';
    element.style.minHeight = 'auto';
    element.style.padding = '0';
    element.style.margin = '0';
    element.style.background = 'white';
    element.style.overflow = 'visible';
    element.style.position = 'relative';
    
    wrapper.appendChild(element);
    
    // Append to body temporarily to calculate full height
    document.body.appendChild(wrapper);
    
    // Wait for content to render and images to load
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Force a reflow to ensure all content is measured
    const height = element.offsetHeight;
    const scrollHeight = element.scrollHeight;
    const fullHeight = Math.max(height, scrollHeight, window.innerHeight);
    
    // Configure PDF options
    const opt = {
      margin: [10, 10, 10, 10], // Add 10mm padding on all sides (top, right, bottom, left)
      filename: `${filename}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, // Higher scale for better quality
        useCORS: true,
        letterRendering: true,
        logging: false,
        windowWidth: 794, // A4 width in pixels at 96 DPI
        windowHeight: fullHeight, // Use full content height
        allowTaint: true,
        scrollY: 0, // Start from top
        height: fullHeight, // Explicit height
        width: 794, // Explicit width
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true,
      },
      pagebreak: { 
        mode: ['css', 'legacy'],
        before: '.page-break-before',
        after: '.page-break-after',
        avoid: ['.no-break', '.signature', '.template-footer'],
      },
    };

    // Generate and download PDF
    await html2pdf().set(opt).from(wrapper).save();
    
    // Clean up
    if (document.body.contains(wrapper)) {
      document.body.removeChild(wrapper);
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};

