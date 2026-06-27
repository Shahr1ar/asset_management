/**
 * Client-side service to handle administrative actions.
 */
export const adminService = {
  /**
   * Requests the server to create a new user account and Firestore profile.
   */
  async createNewUser(userData: { email: string; password: string; displayName?: string; role?: string }) {
    const response = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create user');
    }

    return response.json();
  }
};