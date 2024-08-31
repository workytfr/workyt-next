/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {
        config: './tailwind.config.js',
        },
    autoprefixer
        : {
            flexbox: 'no-2009',
    }
  },
};

export default config;
