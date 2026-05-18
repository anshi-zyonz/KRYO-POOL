// Initialize Lenis for smooth scrolling
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false,
})

function raf(time) {
    lenis.raf(time)
    requestAnimationFrame(raf)
}

requestAnimationFrame(raf)

// Initialize GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Update GSAP on Lenis scroll
lenis.on('scroll', ScrollTrigger.update)

gsap.ticker.add((time) => {
    lenis.raf(time * 1000)
})

gsap.ticker.lagSmoothing(0, 0)

// --- MENU TOGGLE ---
const menuToggle = document.querySelector('.menu-toggle');
const menuOverlay = document.querySelector('.menu-overlay');
const menuLinks = document.querySelectorAll('.menu-overlay a');
let isMenuOpen = false;

function toggleMenu() {
    isMenuOpen = !isMenuOpen;
    if (isMenuOpen) {
        menuOverlay.classList.add('active');
        menuToggle.textContent = 'CLOSE';
        lenis.stop(); // Stop scrolling when menu is open
    } else {
        menuOverlay.classList.remove('active');
        menuToggle.textContent = 'MENU';
        lenis.start();
    }
}

menuToggle.addEventListener('click', toggleMenu);

menuLinks.forEach(link => {
    link.addEventListener('click', () => {
        toggleMenu();
    });
});

// --- SCROLL REVEALS ---
const reveals = document.querySelectorAll('.reveal');

reveals.forEach(el => {
    gsap.to(el, {
        scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none reverse"
        },
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out"
    });
});

// --- HERO PARALLAX ---
gsap.to(".hero-bg", {
    yPercent: 20,
    ease: "none",
    scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true
    }
});

// --- VIDEO SCRUBBING ON SCROLL ---
const spinVideoFs = document.getElementById('spinVideo');

let scrollPos = 0;
let targetPos = 0;
let delay = 0.1; // Controls the "floaty" smoothness (0.1 is smooth, 1.0 is instant)

function initVideoScrub() {
    spinVideoFs.pause();

    // Use ScrollTrigger to calculate target time based on scroll progress within the specific section
    ScrollTrigger.create({
        trigger: ".live-spec-scroll",
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
            if (spinVideoFs.duration) {
                targetPos = self.progress * spinVideoFs.duration;
            }
        }
    });

    // Setup the Lerp loop requested
    setInterval(function () {
        // Linear Interpolation (Lerp) for butter-smooth movement
        scrollPos += (targetPos - scrollPos) * delay;

        // Only update if the change is significant to save CPU
        if (Math.abs(targetPos - scrollPos) > 0.01 && spinVideoFs.duration) {
            // Check if mobile device has buffered enough data before scrubbing
            if (spinVideoFs.readyState >= 2) {
                spinVideoFs.currentTime = scrollPos;
            }
        }
    }, 33);
}

// iOS Video Unlocker Hack
// Mobile browsers often block video rendering until user interaction
let videoUnlocked = false;
document.addEventListener('touchstart', function () {
    if (!videoUnlocked && spinVideoFs) {
        let playPromise = spinVideoFs.play();
        if (playPromise !== undefined) {
            playPromise.then(_ => {
                spinVideoFs.pause();
                videoUnlocked = true;
            }).catch(error => {
                videoUnlocked = true;
            });
        }
    }
}, { once: true });

if (spinVideoFs.readyState >= 1) {
    initVideoScrub();
} else {
    spinVideoFs.addEventListener('loadedmetadata', initVideoScrub);
}

// --- AUTO-SELECT MODEL FROM URL ---
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const modelParam = urlParams.get('model');
    
    if (modelParam) {
        const productSelect = document.getElementById('product');
        if (productSelect) {
            let selectValue = '';
            if (modelParam === 'pool') selectValue = 'KRYO Pool';
            else if (modelParam === 'ice-bath') selectValue = 'KRYO Ice Bath';
            else if (modelParam === 'hot-tub') selectValue = 'KRYO Hot Tub';
            
            if (selectValue) {
                productSelect.value = selectValue;
                
                // Ensure form area is visible (it is by default now, but just in case)
                const formWrapper = document.querySelector('.contact-form-wrapper');
                if (formWrapper && formWrapper.style.height === '0px') {
                    gsap.to(formWrapper, { height: 'auto', opacity: 1, duration: 0.8 });
                }
                
                // Smooth scroll to form
                setTimeout(() => {
                    const contactSection = document.getElementById('contact');
                    if (contactSection && typeof lenis !== 'undefined') {
                        lenis.scrollTo(contactSection, { offset: -50, duration: 1.2 });
                    }
                }, 800);
            }
        }
    }
});

// --- PURCHASE TYPE TOGGLE LOGIC ---
const purchaseButtons = document.querySelectorAll('.btn-purchase-type');
const purchaseTypeInput = document.getElementById('purchaseType');
const durationRow = document.querySelector('.duration-row');
const durationInput = document.getElementById('duration');

purchaseButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all
        purchaseButtons.forEach(b => b.classList.remove('active'));
        // Add active to clicked
        btn.classList.add('active');
        
        const type = btn.getAttribute('data-type');
        purchaseTypeInput.value = type;

        if (type === 'Rent') {
            durationRow.style.display = 'flex';
            durationInput.setAttribute('required', 'required');
            gsap.fromTo(durationRow, 
                { opacity: 0, height: 0 }, 
                { opacity: 1, height: 'auto', duration: 0.4, ease: "power2.out" }
            );
        } else {
            gsap.to(durationRow, {
                opacity: 0,
                height: 0,
                duration: 0.3,
                ease: "power2.in",
                onComplete: () => {
                    durationRow.style.display = 'none';
                    durationInput.removeAttribute('required');
                    durationInput.value = '';
                }
            });
        }
    });
});

// --- LOCATION LOGIC ---
const emirateSelect = document.getElementById('emirate');
const areaRow = document.querySelector('.area-row');
const areaInput = document.getElementById('area');
const btnGetLocation = document.getElementById('btnGetLocation');

if (emirateSelect) {
    emirateSelect.addEventListener('change', () => {
        if (emirateSelect.value) {
            areaRow.style.display = 'flex';
            gsap.fromTo(areaRow, 
                { opacity: 0, height: 0 }, 
                { opacity: 1, height: 'auto', duration: 0.4, ease: "power2.out" }
            );
            areaInput.setAttribute('required', 'required');
        }
    });
}

if (btnGetLocation) {
    btnGetLocation.addEventListener('click', () => {
        if (navigator.geolocation) {
            // Visual feedback
            btnGetLocation.style.opacity = '0.5';
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    areaInput.value = `https://maps.google.com/?q=${lat},${lng}`;
                    btnGetLocation.style.opacity = '1';
                    
                    // Trigger input event so the floating label moves up
                    areaInput.dispatchEvent(new Event('input'));
                    // Add valid class if needed for floating label styling
                    areaInput.classList.add('valid');
                },
                (error) => {
                    console.error("Error getting location: ", error);
                    alert("Unable to retrieve your location automatically. Please enter your area manually or paste a map link.");
                    btnGetLocation.style.opacity = '1';
                }
            );
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    });
}

