import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"

export default function LanguageSelectionView({ onBack, availableLanguages, onSelectLanguage }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-center flex-grow">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 tracking-tight">Choose Your Adventure</h1>
            <p className="text-lg text-gray-600 mt-1">A new language is a new life</p>
          </div>
          <div className="w-10"></div> {/* Spacer */}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {availableLanguages.map((language) => (
            <Card 
              key={language.id} 
              className="group cursor-pointer overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-purple-400"
              onClick={() => onSelectLanguage(language)}
            >
              <CardContent className="p-0">
                <div className={`h-32 bg-gradient-to-r ${language.color} flex items-center justify-center`}>
                  <div className="text-6xl" style={{transform: 'scale(1.5)'}}>{language.flag}</div>
                </div>
                <div className="p-6 bg-white">
                  <h3 className="text-2xl font-bold text-gray-800 truncate">{language.displayName}</h3>
                  <Badge 
                    variant="default" 
                    className="mt-2 bg-purple-500 text-white group-hover:bg-purple-600 transition-colors"
                  >
                    {language.difficulty}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
