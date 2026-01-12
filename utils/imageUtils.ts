import { ImageSourcePropType } from 'react-native';

/**
 * Safely creates an Image source from hero_image_url
 * 
 * Handles:
 * - Local require() results (numbers)
 * - Remote URL strings
 * - undefined/null values
 * - Empty strings
 * 
 * @param heroImageUrl - The image URL or local require result
 * @returns ImageSourcePropType or null if invalid
 */
export const getImageSource = (
    heroImageUrl: string | number | undefined | null
): ImageSourcePropType | null => {
    // Handle undefined/null
    if (heroImageUrl === undefined || heroImageUrl === null) {
        return null;
    }

    // Handle local require() results (these are numbers in React Native)
    if (typeof heroImageUrl === 'number') {
        return heroImageUrl;
    }

    // Handle string URLs
    if (typeof heroImageUrl === 'string') {
        const trimmed = heroImageUrl.trim();
        // Skip empty strings
        if (trimmed === '') {
            return null;
        }
        return { uri: trimmed };
    }

    return null;
};

/**
 * Checks if an image source is valid (non-null)
 * Use this for conditional rendering
 */
export const hasValidImageSource = (
    heroImageUrl: string | number | undefined | null
): boolean => {
    return getImageSource(heroImageUrl) !== null;
};
