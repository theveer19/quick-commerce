// Demo catalog so the whole app works before Supabase is wired.
// Once you add products in Supabase, real data replaces this automatically.
const img = (q) => `https://images.unsplash.com/${q}?auto=format&fit=crop&w=800&q=80`;

export const CATEGORIES = [
  { slug: 'women', name: 'Women', emoji: '👗', subs: [
    { name: 'Tops', slug: 'tops' }, { name: 'Dresses', slug: 'dresses' }, { name: 'Jeans', slug: 'jeans' },
    { name: 'Pants', slug: 'pants' }, { name: 'Kurtas', slug: 'kurtas' }, { name: 'Lowers', slug: 'lowers' },
  ]},
  { slug: 'men', name: 'Men', emoji: '👔', subs: [
    { name: 'T-Shirts', slug: 'tshirts' }, { name: 'Shirts', slug: 'shirts' }, { name: 'Jeans', slug: 'jeans' },
    { name: 'Pants', slug: 'pants' }, { name: 'Lowers', slug: 'lowers' },
  ]},
  { slug: 'ethnic', name: 'Ethnic', emoji: '🥻', subs: [
    { name: 'Kurtas', slug: 'kurtas' }, { name: 'Sarees', slug: 'sarees' },
    { name: 'Lehengas', slug: 'lehengas' }, { name: 'Sherwanis', slug: 'sherwanis' },
  ]},
];

// helper for other files
export const SUBCATEGORIES = CATEGORIES.reduce((m, c) => { m[c.slug] = c.subs; return m; }, {});

export const SEED_PRODUCTS = [
  { id: 'p1', name: 'Oversized Cotton Tee', category: 'men', subcategory: 'tshirts', price: 699, mrp: 1199, stock: 24, sizes: ['S','M','L','XL'], colors: [{name:'Black',hex:'#222222'},{name:'Off White',hex:'#EFEAE2'},{name:'Olive',hex:'#6B7A52'}], image: img('photo-1521572163474-6864f9cf17ab'), description: 'Heavyweight 240 GSM oversized tee. Pre-shrunk, soft-hand feel.', rating: 4.5, is_active: true },
  { id: 'p2', name: 'High-Rise Straight Jeans', category: 'women', subcategory: 'jeans', price: 1299, mrp: 2499, stock: 12, sizes: ['26','28','30','32'], colors: [{name:'Indigo',hex:'#3B4C6B'},{name:'Light Blue',hex:'#8FB3D9'},{name:'Black',hex:'#222222'}], image: img('photo-1541099649105-f69ad21f3246'), description: 'Rigid denim, high-rise straight fit. Ankle length.', rating: 4.6, is_active: true },
  { id: 'p3', name: 'Chunky Dad Sneakers', category: 'footwear', subcategory: 'sneakers', price: 1899, mrp: 3499, stock: 8, sizes: ['6','7','8','9','10'], colors: [{name:'White',hex:'#F3F4F6'},{name:'Grey',hex:'#9AA0A6'}], image: img('photo-1595950653106-6c9ebd614d3a'), description: 'Cushioned chunky sole, breathable mesh upper.', rating: 4.4, is_active: true },
  { id: 'p4', name: 'Structured Tote Bag', category: 'accessories', subcategory: 'bags', price: 999, mrp: 1799, stock: 15, sizes: ['One Size'], colors: [{name:'Tan',hex:'#C9A77A'},{name:'Black',hex:'#222222'}], image: img('photo-1584917865442-de89df76afd3'), description: 'Vegan leather structured tote with inner zip pocket.', rating: 4.3, is_active: true },
  { id: 'p5', name: 'Anarkali Kurta Set', category: 'ethnic', subcategory: 'kurtas', price: 1799, mrp: 3299, stock: 10, sizes: ['S','M','L','XL'], colors: [{name:'Maroon',hex:'#7B2D3A'},{name:'Teal',hex:'#1E6E6E'},{name:'Mustard',hex:'#C99A2E'}], image: img('photo-1610030469983-98e550d6193c'), description: 'Floor-length anarkali with dupatta. Festive-ready.', rating: 4.7, is_active: true },
  { id: 'p6', name: 'Relaxed Linen Shirt', category: 'men', subcategory: 'shirts', price: 1099, mrp: 1999, stock: 18, sizes: ['S','M','L','XL'], colors: [{name:'White',hex:'#F2EFEA'},{name:'Sky',hex:'#AECBE8'},{name:'Sand',hex:'#D9C7A7'}], image: img('photo-1596755094514-f87e34085b2c'), description: 'Breathable pure linen, relaxed fit. Perfect for Gwalior summers.', rating: 4.5, is_active: true },
  { id: 'p7', name: 'Ribbed Bodycon Dress', category: 'women', subcategory: 'dresses', price: 899, mrp: 1699, stock: 20, sizes: ['XS','S','M','L'], colors: [{name:'Black',hex:'#222222'},{name:'Rose',hex:'#C98B9E'},{name:'Cream',hex:'#EFE7DA'}], image: img('photo-1595777457583-95e059d581b8'), description: 'Stretch ribbed knit bodycon midi dress.', rating: 4.2, is_active: true },
  { id: 'p8', name: 'Minimal Analog Watch', category: 'accessories', subcategory: 'watches', price: 1499, mrp: 2999, stock: 6, sizes: ['One Size'], colors: [{name:'Silver',hex:'#C7CBD1'},{name:'Rose Gold',hex:'#D8A79B'}], image: img('photo-1523275335684-37898b6baf30'), description: 'Slim case, leather strap, 3ATM water resistant.', rating: 4.6, is_active: true },
  { id: 'p9', name: 'Slim Fit Chinos', category: 'men', subcategory: 'pants', price: 1199, mrp: 1999, stock: 16, sizes: ['30','32','34','36'], colors: [{name:'Beige',hex:'#D9C7A7'},{name:'Navy',hex:'#2A3A5A'},{name:'Olive',hex:'#6B7A52'}], image: img('photo-1473966968600-fa801b869a1a'), description: 'Stretch cotton chinos with a tailored slim fit.', rating: 4.3, is_active: true },
  { id: 'p10', name: 'Cropped Cotton Top', category: 'women', subcategory: 'tops', price: 599, mrp: 1099, stock: 28, sizes: ['XS','S','M','L'], colors: [{name:'White',hex:'#F3F4F6'},{name:'Lavender',hex:'#C9B8F2'},{name:'Pink',hex:'#F2C6D6'}], image: img('photo-1554568218-0f1715e72254'), description: 'Soft cotton cropped top with a boxy fit.', rating: 4.4, is_active: true },
  { id: 'p11', name: 'Fleece Jogger Lowers', category: 'men', subcategory: 'lowers', price: 799, mrp: 1499, stock: 22, sizes: ['S','M','L','XL'], colors: [{name:'Charcoal',hex:'#3A3F45'},{name:'Grey',hex:'#9AA0A6'}], image: img('photo-1552902865-b72c031ac5ea'), description: 'Cosy fleece joggers with tapered fit and pockets.', rating: 4.5, is_active: true },
  { id: 'p12', name: 'Banarasi Silk Saree', category: 'ethnic', subcategory: 'sarees', price: 2999, mrp: 5999, stock: 7, sizes: ['One Size'], colors: [{name:'Red',hex:'#9B2A3A'},{name:'Emerald',hex:'#1E6E4E'}], image: img('photo-1610189844963-6f4f4a1a1e2a'), description: 'Handwoven Banarasi silk saree with zari border.', rating: 4.8, is_active: true },
];
