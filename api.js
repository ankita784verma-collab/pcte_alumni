/**
 * PCTE Alumni Talks - Local Storage API Helper Layer
 */

const API = {
  // Get currently logged-in user session
  getCurrentUser() {
    const session = localStorage.getItem('pcte_logged_user');
    return session ? JSON.parse(session) : null;
  },

  // Save user session on login
  setCurrentUser(user) {
    localStorage.setItem('pcte_logged_user', JSON.stringify(user));
  },

  // Clear session and redirect home
  logout() {
    localStorage.removeItem('pcte_logged_user');
    window.location.href = 'index.html';
  },

  // Retrieve alumni directory records (with default seed data)
  getAlumni() {
    const stored = localStorage.getItem('pcte_alumni_data');
    if (!stored) {
      const initialAlumni = [
        { id: 1, name: "Rahul Sharma", role: "Software Architect at TechCorp", batch: "Batch 2018 · B.Tech CSE", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop" },
        { id: 2, name: "Priya Verma", role: "Financial Analyst, Global Bank", batch: "Batch 2020 · MBA Finance", photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop" },
        { id: 3, name: "Amanpreet Singh", role: "Product Manager, SaaS Solutions", batch: "Batch 2019 · BBA", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop" },
        { id: 4, name: "Neha Kapoor", role: "UI/UX Lead Designer", batch: "Batch 2021 · BCA", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop" }
      ];
      localStorage.setItem('pcte_alumni_data', JSON.stringify(initialAlumni));
      return initialAlumni;
    }
    return JSON.parse(stored);
  },

  // Save/update alumni directory records
  saveAlumni(alumniList) {
    localStorage.setItem('pcte_alumni_data', JSON.stringify(alumniList));
  }
};