/**
 * Storage service using AWS Amplify v6
 */
import { uploadData, downloadData, remove, list, getUrl } from 'aws-amplify/storage';

/**
 * Storage service
 */
export const storageService = {
  /**
   * Upload a file to storage
   * @param file File to upload
   * @param key Storage key (path)
   * @returns Upload result
   */
  uploadFile: async (file: File, key: string) => {
    try {
      const result = await uploadData({
        path: key,
        data: file,
        options: {
          contentType: file.type
        }
      }).result;
      return result;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  /**
   * Get a file from storage
   * @param key Storage key (path)
   * @returns File URL
   */
  getFile: async (key: string) => {
    try {
      const result = downloadData({
        path: key
      });
      const downloadResult = await result.result;
      const url = URL.createObjectURL(await downloadResult.body.blob());
      return url;
    } catch (error) {
      console.error('Error getting file:', error);
      throw error;
    }
  },

  /**
   * List files in storage
   * @param path Path prefix
   * @returns List of files
   */
  listFiles: async (path: string = '') => {
    try {
      const result = await list({
        path
      });
      return result;
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  },

  /**
   * Remove a file from storage
   * @param key Storage key (path)
   * @returns Removal result
   */
  removeFile: async (key: string) => {
    try {
      const result = await remove({
        path: key
      });
      return result;
    } catch (error) {
      console.error('Error removing file:', error);
      throw error;
    }
  },

  /**
   * Get a signed URL for a file (useful for temporary access)
   * @param key Storage key (path)
   * @param expires Expiration time in seconds (default: 900 seconds = 15 minutes)
   * @returns Signed URL
   */
  getSignedUrl: async (key: string, expires: number = 900) => {
    try {
      const result = await getUrl({
        path: key,
        options: { 
          expiresIn: expires
        }
      });
      return result.url;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      throw error;
    }
  }
};

export default storageService;