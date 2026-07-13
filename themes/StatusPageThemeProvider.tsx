import { alpha, darken } from '@mui/material/styles';

interface StatusPageThemeProviderProps {
    brandColor?: string; // New prop for brand color
    // other props...
}

const resolveBrandTokens = (brandColor?: string) => {
    if (!brandColor) return {};
    
    const brand = brandColor;
    const brandStrong = darken(brandColor, 0.2);
    const brandSoft = alpha(brandColor, 0.15);
    
    return { brand, brandStrong, brandSoft };
};

// Inside the component
const { brand, brandStrong, brandSoft } = resolveBrandTokens(brandColor);