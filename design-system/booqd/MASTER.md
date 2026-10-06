# Booq’d design system

Existing web project: Next.js / React / Tailwind. Applied guidance from ui-ux-pro-max; React Native-only advice is excluded.

Preserve purple brand (#a62fd1; darker #8b24ae for text), light neutral surfaces, and the existing sans-serif family. Use spacious cards, readable text, consistent outline SVG icons and a clear primary action. No invented reviews or misleading stock provider photos.

Controls have 44px minimum targets, visible keyboard focus, associated labels, announced loading/error states, and reduced-motion support. Mobile layouts use 16px gutters and wrap actions without horizontal scrolling. Test 375px portrait, landscape, and enlarged text.

Booking: choose service/date/available time → review location, duration and price → send request. Describe pending confirmation and direct provider payment explicitly. Available times respect saved weekly hours and existing bookings. Search filters remain in the URL. Upcoming and past bookings have distinct states.
