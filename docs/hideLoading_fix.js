function hideLoading() {
    console.log("Attempting to hide loading modal...");
    
    // Try Bootstrap modal first
    const modal = bootstrap.Modal.getInstance(document.getElementById("loadingModal"));
    if (modal) {
        console.log("Hiding with Bootstrap modal instance");
        modal.hide();
    }
    
    // Force hide the modal directly
    const modalElement = document.getElementById("loadingModal");
    if (modalElement) {
        console.log("Force hiding modal element");
        modalElement.style.display = "none";
        modalElement.classList.remove("show");
        modalElement.classList.remove("modal", "fade", "show");
        
        // Remove backdrop
        const backdrop = document.querySelector(".modal-backdrop");
        if (backdrop) {
            backdrop.remove();
        }
        
        // Remove modal-open class from body
        document.body.classList.remove("modal-open");
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
    }
    
    console.log("Loading modal hidden");
}
