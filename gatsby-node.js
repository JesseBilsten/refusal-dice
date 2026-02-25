/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

/**
 * Calculate MD5 hash of a file
 */
function getFileHash(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Check if roll-game matrix needs regeneration
 */
function needsRegeneration() {
  const metadataPath = path.join(__dirname, 'src/data', '.cache-metadata', 'roll-matrix-metadata.json');
  const outputPath = path.join(__dirname, 'src/data', 'roll-game-matrix.json');
  
  // If output doesn't exist, regenerate
  if (!fs.existsSync(outputPath)) {
    console.log('Roll-game matrix not found, will regenerate');
    return true;
  }
  
  // If metadata doesn't exist, regenerate
  if (!fs.existsSync(metadataPath)) {
    return true;
  }
  
  try {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    const dependencies = {
      'src/data/generate-roll-game-matrix.js': path.join(__dirname, 'src/data/generate-roll-game-matrix.js'),
      'src/lib/game-validation.js': path.join(__dirname, 'src/lib/game-validation.js'),
      'src/data/unique-rolls.json': path.join(__dirname, 'src/data/unique-rolls.json')
    };
    
    // Check if any dependency has changed
    for (const [key, filePath] of Object.entries(dependencies)) {
      if (!fs.existsSync(filePath)) {
        console.warn(`Dependency missing: ${key}, will regenerate`);
        return true;
      }
      
      const currentHash = getFileHash(filePath);
      if (metadata.fileHashes[key] !== currentHash) {
        console.log(`Change detected in: ${key}, will regenerate`);
        return true;
      }
    }
    
    console.log('Roll-game matrix is up to date');
    return false;
  } catch (error) {
    console.warn('Error reading metadata, will regenerate:', error.message);
    return true;
  }
}

/**
 * Save metadata about the generated matrix
 */
function saveMetadata() {
  const metadataPath = path.join(__dirname, 'src/data', '.cache-metadata', 'roll-matrix-metadata.json');
  const dependencies = {
    'src/data/generate-roll-game-matrix.js': path.join(__dirname, 'src/data/generate-roll-game-matrix.js'),
    'src/lib/game-validation.js': path.join(__dirname, 'src/lib/game-validation.js'),
    'src/data/unique-rolls.json': path.join(__dirname, 'src/data/unique-rolls.json')
  };
  
  const metadata = {
    version: '1.0.0',
    lastGenerated: new Date().toISOString(),
    fileHashes: Object.fromEntries(
      Object.entries(dependencies).map(([key, filePath]) => [key, getFileHash(filePath)])
    )
  };
  
  // Ensure metadata directory exists
  const metadataDir = path.join(__dirname, 'src/data', '.cache-metadata');
  if (!fs.existsSync(metadataDir)) {
    fs.mkdirSync(metadataDir, { recursive: true });
  }
  
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
}

/**
 * Pre-generate roll-game matrix before Gatsby build starts
 */
exports.onPreBootstrap = async ({ reporter }) => {
  if (!needsRegeneration()) {
    reporter.info('Roll-game matrix is up to date, skipping regeneration');
    return;
  }
  
  reporter.info('Generating roll-game matrix...');
  
  try {
    // Import and run the generation script
    const generateMatrix = require('./src/data/generate-roll-game-matrix.js');
    await generateMatrix();
    
    // Save metadata for future dirty bit checks
    saveMetadata();
    
    reporter.success('Roll-game matrix generated successfully');
  } catch (error) {
    reporter.warn(`Failed to generate roll-game matrix: ${error.message}`);
    reporter.warn('Build will continue, but runtime validation will be used as fallback');
    // Don't throw - allow build to continue with runtime validation
  }
};

/**
 * Create individual game detail pages
 */
exports.createPages = async ({ actions }) => {
  const { createPage } = actions;
  
  const gameDetailTemplate = path.resolve('./src/templates/game-detail.js');
  
  // List of all games + barking
  const games = [
    '10-2',
    '10-3', 
    '10-4',
    'ship-captain-crew',
    'monterey',
    'vegas',
    'pairs',
    'razzle',
    'boss',
    'tres-away',
    'barking'
  ];
  
  // Create a page for each game
  games.forEach(gameId => {
    createPage({
      path: `/games/${gameId}`,
      component: gameDetailTemplate,
      context: {
        gameId: gameId,
      },
    });
  });
};

// No special webpack configuration needed
