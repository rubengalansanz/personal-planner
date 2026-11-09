# Changelog

## [0.2.2] - 2026-11-09

### Added
- Calendario unificado: citas, tareas, cumpleaños, proyectos, hitos del planner y notas, con chips de colores por sección.
- Edición inline desde el calendario para cualquier entrada (sin ir a su pestaña).
- Filtros por sección en el calendario (checkboxes) con etiquetas traducidas.
- Modal de confirmación de eliminación (reemplaza `window.confirm`).
- CI (`lint`, `typecheck`, `build`) y workflow de release para Windows/Linux/macOS.
- Nombres de artefactos consistentes: `personal-planner-<version>-<os>-<arch>.<ext>`.

### Fixed
- Hidratación: anidamiento inválido `<p>` conteniendo `<div>/<h2>/<form>` en el planner.
- Cumpleaños: desfase de un día (UTC vs. local) al guardar/mostrar.
- Fechas sin hora: normalización consistente para evitar retrocesos.
- Etiquetas de filtros del calendario en el idioma adecuado (sin duplicar "Planner").

### Changed
- `EntityDialog` ahora usa un modal de confirmación para borrados.
- `DeleteButton` reutilizable para borrados con confirmación.

## [0.2.1] - 2026-11-07
- Primeras mejoras de Personal Planner.
