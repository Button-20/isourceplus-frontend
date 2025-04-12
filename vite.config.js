export default defineConfig({
	plugins: [react()],
	server: {
	  port: 5000,
	  host: true,
	  proxy: {
		'/api': {
		  target: 'http://127.0.0.1:8000',
		  changeOrigin: true,
		  rewrite: (path) => path.replace(/^\/api/, ''),
		  secure: false,
		}
	  }
	},
	resolve: {
	  alias: {
		"@": path.resolve(__dirname, "./src"),
	  },
	},
  })