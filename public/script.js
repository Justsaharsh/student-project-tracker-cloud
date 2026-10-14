const form = document.querySelector('#project-form');
const nameInput = document.querySelector('#name');
const statusInput = document.querySelector('#status');
const saveButton = document.querySelector('#save-button');
const cancelButton = document.querySelector('#cancel-button');
const message = document.querySelector('#message');
const projectList = document.querySelector('#project-list');
const emptyState = document.querySelector('#empty-state');

// Projects are loaded from the Express API.
let projects = [];

// null means Add mode; otherwise, this is the ID being edited.
let editingId = null;

// Track loading and saving operations.
let isBusy = false;
let hasLoadedProjects = false;

// Make sure the page contains the elements this script needs.
const requiredElements = [
  form,
  nameInput,
  statusInput,
  saveButton,
  cancelButton,
  message,
  projectList,
  emptyState
];

if (requiredElements.some(element => !element)) {
  throw new Error(
    'A required HTML element is missing. Check public/index.html.'
  );
}

// Disable mutation controls while a request is in progress.
function updateMutationControls() {
  saveButton.disabled = isBusy;
  cancelButton.disabled = isBusy;

  projectList.querySelectorAll('button').forEach(button => {
    button.disabled = isBusy;
  });
}

// Send a request to the Express API.
async function apiRequest(url, options = {}) {
  let response;

  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new Error(
      'Network error: Could not reach the server. Check that your server is running and try again.'
    );
  }

  let data = null;

  try {
    data = await response.json();
  } catch (error) {
    // The response may not contain valid JSON.
  }

  if (!response.ok) {
    throw new Error(
      data?.error || `Request failed with status ${response.status}.`
    );
  }

  return data;
}

// Return the form to Add mode.
function resetForm() {
  form.reset();
  editingId = null;

  saveButton.textContent = 'Save Project';
  cancelButton.hidden = true;
}

// Draw the projects currently loaded from the API.
function renderProjects() {
  projectList.replaceChildren();

  // Don't display the empty state before a successful API response.
  emptyState.hidden = projects.length > 0 || !hasLoadedProjects;

  projects.forEach(project => {
    const listItem = document.createElement('li');

    const projectName = document.createElement('h3');
    projectName.textContent = project.name;

    const projectStatus = document.createElement('p');
    projectStatus.textContent = `Status: ${project.status}`;

    // Edit button.
    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.textContent = 'Edit';
    editButton.disabled = isBusy;

    editButton.addEventListener('click', () => {
      if (isBusy) return;

      editingId = project.id;

      nameInput.value = project.name;
      statusInput.value = project.status;

      saveButton.textContent = 'Save changes';
      cancelButton.hidden = false;

      message.textContent = `Editing "${project.name}".`;
      nameInput.focus();
    });

    // Delete button.
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'Delete';
    deleteButton.disabled = isBusy;

    deleteButton.addEventListener('click', async () => {
      if (isBusy) return;

      const confirmed = window.confirm(
        `Are you sure you want to delete "${project.name}"?`
      );

      // Cancelling must not send a DELETE request.
      if (!confirmed) return;

      isBusy = true;
      updateMutationControls();

      message.textContent = `Deleting "${project.name}"...`;

      try {
        await apiRequest(
          `/api/projects/${encodeURIComponent(project.id)}`,
          {
            method: 'DELETE'
          }
        );

        // Leave Edit mode if the deleted record was being edited.
        if (editingId === project.id) {
          resetForm();
        }

        const successMessage = `"${project.name}" deleted successfully.`;

        const refreshed = await loadProjects({
          successMessage
        });

        if (!refreshed) {
          message.textContent =
            `${successMessage} However, the project list could not be refreshed. ` +
            lastLoadError;
        }
      } catch (error) {
        message.textContent = `Could not delete project: ${error.message}`;
      } finally {
        isBusy = false;
        updateMutationControls();
      }
    });

    listItem.append(
      projectName,
      projectStatus,
      editButton,
      deleteButton
    );

    projectList.appendChild(listItem);
  });
}

// Store the most recent loading error for useful feedback.
let lastLoadError = '';

// Load the current collection from the API.
async function loadProjects({ successMessage = null } = {}) {
  const wasBusy = isBusy;

  isBusy = true;
  updateMutationControls();

  try {
    if (!successMessage) {
      message.textContent = 'Loading projects...';
    }

    emptyState.hidden = true;

    const data = await apiRequest('/api/projects');

    if (!Array.isArray(data)) {
      throw new Error('The server returned an invalid project list.');
    }

    projects = data;
    hasLoadedProjects = true;
    lastLoadError = '';

    renderProjects();

    if (successMessage) {
      message.textContent = successMessage;
    } else if (projects.length === 0) {
      message.textContent =
        'No projects yet. Add your first project above.';
    } else {
      message.textContent = 'Projects loaded successfully.';
    }

    return true;
  } catch (error) {
    lastLoadError = error.message;

    // A failed request must not look like a successfully loaded empty list.
    emptyState.hidden = true;

    message.textContent = `Could not load projects: ${error.message}`;

    return false;
  } finally {
    isBusy = wasBusy;
    updateMutationControls();
  }
}

// Handle adding and editing through one form submit listener.
form.addEventListener('submit', async event => {
  event.preventDefault();

  if (isBusy) return;

  const name = nameInput.value.trim();
  const status = statusInput.value;

  if (!name) {
    message.textContent = 'Please enter a project name.';
    nameInput.focus();
    return;
  }

  if (name.length > 80) {
    message.textContent =
      'Project names must contain no more than 80 characters.';
    nameInput.focus();
    return;
  }

  const isEditing = editingId !== null;
  const projectId = editingId;

  const url = isEditing
    ? `/api/projects/${encodeURIComponent(projectId)}`
    : '/api/projects';

  const method = isEditing ? 'PUT' : 'POST';

  isBusy = true;
  updateMutationControls();

  message.textContent = isEditing
    ? 'Saving project changes...'
    : 'Saving new project...';

  try {
    await apiRequest(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        status
      })
    });

    // Reset only after the server confirms the mutation succeeded.
    resetForm();

    const successMessage = isEditing
      ? `"${name}" updated successfully.`
      : `"${name}" added successfully.`;

    // Fetch the authoritative collection again.
    const refreshed = await loadProjects({
      successMessage
    });

    if (!refreshed) {
      message.textContent =
        `${successMessage} However, the project list could not be refreshed. ` +
        lastLoadError;
    }
  } catch (error) {
    // Keep the user's input and Edit mode if the mutation fails.
    message.textContent =
      `Could not ${isEditing ? 'update' : 'add'} project: ${error.message}`;
  } finally {
    isBusy = false;
    updateMutationControls();
  }
});

// Cancel editing without sending a request.
cancelButton.addEventListener('click', () => {
  if (isBusy) return;

  resetForm();

  message.textContent =
    'Editing cancelled. No changes were saved.';
});

// Start the app by loading projects from the Express API.
loadProjects();