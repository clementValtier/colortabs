export async function persist(colorMappings) {
  try {
    await browser.storage.local.set({ colorMappings });
  } catch (e) {
    throw new Error(`ColorTabs: storage write failed — ${e.message}`);
  }
}

export async function loadMappings() {
  const stored = await browser.storage.local.get('colorMappings');
  return stored.colorMappings ?? [];
}
