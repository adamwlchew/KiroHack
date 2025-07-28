import { get, post, put, del } from 'aws-amplify/api';
import { generateClient } from 'aws-amplify/api';

/**
 * Service for handling API operations using AWS Amplify API
 */
export const amplifyApiService = {
  /**
   * Make a GET request using Amplify API
   * @param apiName API name configured in Amplify
   * @param path API path
   * @param options Request options
   * @returns Promise with the response data
   */
  get: async (apiName: string, path: string, options: any = {}) => {
    try {
      return await get({ apiName, path, options }).response;
    } catch (error) {
      console.error(`Error making GET request to ${path}:`, error);
      throw error;
    }
  },

  /**
   * Make a POST request using Amplify API
   * @param apiName API name configured in Amplify
   * @param path API path
   * @param body Request body
   * @param options Request options
   * @returns Promise with the response data
   */
  post: async (apiName: string, path: string, body: any, options: any = {}) => {
    try {
      return await post({ 
        apiName, 
        path, 
        options: { 
          body, 
          ...options 
        } 
      }).response;
    } catch (error) {
      console.error(`Error making POST request to ${path}:`, error);
      throw error;
    }
  },

  /**
   * Make a PUT request using Amplify API
   * @param apiName API name configured in Amplify
   * @param path API path
   * @param body Request body
   * @param options Request options
   * @returns Promise with the response data
   */
  put: async (apiName: string, path: string, body: any, options: any = {}) => {
    try {
      return await put({ 
        apiName, 
        path, 
        options: { 
          body, 
          ...options 
        } 
      }).response;
    } catch (error) {
      console.error(`Error making PUT request to ${path}:`, error);
      throw error;
    }
  },

  /**
   * Make a DELETE request using Amplify API
   * @param apiName API name configured in Amplify
   * @param path API path
   * @param options Request options
   * @returns Promise with the response data
   */
  delete: async (apiName: string, path: string, options: any = {}) => {
    try {
      return await del({ apiName, path, options }).response;
    } catch (error) {
      console.error(`Error making DELETE request to ${path}:`, error);
      throw error;
    }
  },

  /**
   * Make a GraphQL query using Amplify API
   * @param query GraphQL query
   * @param variables Query variables
   * @param options Request options
   * @returns Promise with the response data
   */
  graphqlQuery: async (query: string, variables: any = {}, options: any = {}) => {
    try {
      const client = generateClient();
      const result = await client.graphql({
        query,
        variables,
        ...options
      });
      return result;
    } catch (error) {
      console.error('Error making GraphQL query:', error);
      throw error;
    }
  },

  /**
   * Make a GraphQL mutation using Amplify API
   * @param mutation GraphQL mutation
   * @param variables Mutation variables
   * @param options Request options
   * @returns Promise with the response data
   */
  graphqlMutation: async (mutation: string, variables: any = {}, options: any = {}) => {
    try {
      const client = generateClient();
      const result = await client.graphql({
        query: mutation,
        variables,
        ...options
      });
      return result;
    } catch (error) {
      console.error('Error making GraphQL mutation:', error);
      throw error;
    }
  }
};

export default amplifyApiService;