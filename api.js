const API_BASE_URL = "http://localhost:5000/api/v1"; // Change to your live Render backend URL in production

// Function to load Alumni Directory dynamically
async function loadAlumniDirectory() {
  const gridContainer = document.getElementById('alumniGrid');
  if (!gridContainer) return;

  try {
    const response = await fetch(`${API_BASE_URL}/alumni`);
    const alumniList = await response.json();

    gridContainer.innerHTML = ""; // Clear existing placeholder content

    if (alumniList.length === 0) {
      gridContainer.innerHTML = `<p class="text-center text-muted">No alumni profiles found.</p>`;
      return;
    }

    alumniList.forEach(alumnus => {
      const cardHTML = `
        <div class="col-md-4 searchable-item">
          <div class="card h-100 shadow-sm border-0 text-center p-4">
            <img src="assets/img/profilePic/${alumnus.profile_pic || 'default.png'}" class="rounded-circle mx-auto mb-3 shadow-sm" width="100" height="100" alt="${alumnus.full_name}" style="object-fit: cover;" onerror="this.src='https://via.placeholder.com/100'">
            <h5 class="fw-bold mb-1">${alumnus.full_name}</h5>
            <p class="text-danger small fw-semibold mb-2">${alumnus.current_title || 'Professional'} at ${alumnus.company || 'Global Enterprise'}</p>
            <p class="text-muted small mb-3">Batch of ${alumnus.batch_year} | ${alumnus.course}</p>
            <div class="d-flex justify-content-center gap-2 mt-auto">
              <a href="#" class="btn btn-outline-dark btn-sm rounded-circle"><i class="bi bi-linkedin"></i></a>
              <a href="#" class="btn btn-outline-pcte-red btn-sm rounded-circle"><i class="bi bi-envelope"></i></a>
            </div>
          </div>
        </div>
      `;
      gridContainer.innerHTML += cardHTML;
    });
  } catch (error) {
    console.error("Error fetching alumni directory:", error);
  }
}

// Automatically load directory if on the directory page
document.addEventListener('DOMContentLoaded', () => {
  loadAlumniDirectory();
});