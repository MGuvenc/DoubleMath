import { getHomePageForEditing } from "./actions";
import HomePageEditor from "@/components/admin/HomePageEditor";

export default async function AdminPagesPage() {
  const page = await getHomePageForEditing();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Anasayfa (CMS)</h1>
      <p className="mt-1 text-sm text-slate-500">
        Anasayfadaki metinleri buradan düzenle. Kaydettiğinde site anında güncellenir.
      </p>

      <div className="mt-6">
        <HomePageEditor page={page} />
      </div>
    </div>
  );
}